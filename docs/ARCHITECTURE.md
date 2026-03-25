# Architecture

## Overview

zosma-qa is structured as a **pnpm monorepo** with five publishable packages and a clear separation between the framework core, test runners, and the CLI UX layer.

```
zosma-qa/
├── packages/
│   ├── core/          — plugin interface, config system, test discovery
│   ├── playwright/    — Playwright runner and base config (web testing)
│   ├── appium/        — Appium runner, test helpers, device management (mobile testing)
│   ├── k6/            — k6 load testing runner, script discovery, templates
│   ├── cli/           — interactive CLI (`npx zosma-qa`)
│   └── zosma-qa/      — CLI entry point wrapper
├── templates/         — scaffold content for `npx zosma-qa init`
├── examples/          — working test suites that demo the framework
├── tests/             — root test directory (users put their tests here)
├── specs/             — AI planner markdown output
└── .github/agents/    — Playwright agent definitions
```

---

## Package Dependency Graph

```
@zosmaai/zosma-qa-cli
  ├── @zosmaai/zosma-qa-core
  └── @zosmaai/zosma-qa-playwright
        └── @zosmaai/zosma-qa-core

@zosmaai/zosma-qa-appium
  └── @zosmaai/zosma-qa-core
  (peer: appium >=2.0.0)

@zosmaai/zosma-qa-k6
  └── @zosmaai/zosma-qa-core
  (peer: k6 CLI binary)

zosma-qa (entry point wrapper)
  └── @zosmaai/zosma-qa-cli
```

- `@playwright/test` is a **peer dependency** of `@zosmaai/zosma-qa-playwright` — users supply their own version
- `appium` is a **peer dependency** of `@zosmaai/zosma-qa-appium` — users install it globally or locally

---

## packages/core

**Purpose:** Shared foundation. No runtime dependencies on Playwright or any specific test runner.

**Exports:**

| Export | Description |
|---|---|
| `defineConfig(overrides)` | Merges user config with zosma-qa defaults; used in `zosma.config.ts` |
| `loadConfig(cwd)` | Dynamically loads `zosma.config.ts` at runtime |
| `findTestFiles(testDir)` | Walks the test directory and returns matching spec files |
| `ZosmaPlugin` | Interface every test runner plugin must implement |
| `Browser`, `AgentLoop`, `TestResult`, `RunSummary` | Shared types |

**Plugin interface:**

```typescript
interface ZosmaPlugin {
  name: string;
  run(config: RunnerConfig): Promise<TestResult[]>;
  report?(results: TestResult[]): Promise<void>;
}
```

Any future runner (k6, Artillery, REST) implements this interface. The CLI calls `plugin.run()` and knows nothing about the internals.

---

## packages/playwright

**Purpose:** Playwright runner plugin + exportable base config.

**Key design decision:** Rather than generating a `playwright.config.ts` with every option spelled out, this package exports a `defineConfig()` function that users *extend*. This means:
- Users get all defaults for free
- Upgrading zosma-qa automatically improves defaults
- Users can override anything Playwright supports

**Base config defaults:**

```
fullyParallel: true
forbidOnly: true (CI only)
retries: 2 (CI) / 0 (local)
workers: 1 (CI) / auto (local)
reporters: html + list + github (CI)
trace: on-first-retry
screenshot: only-on-failure
video: retain-on-failure
```

**Browser mapping:** The `browsers` shorthand maps to Playwright's `devices` presets:
- `chromium` → Desktop Chrome
- `firefox` → Desktop Firefox
- `webkit` → Desktop Safari

---

## packages/appium

**Purpose:** Appium runner plugin for mobile testing (iOS, Android, React Native, Flutter).

**Key modules:**

| Module | Description |
|---|---|
| `config/` | Config types, smart defaults, capabilities builder, auto-detection |
| `server/` | Appium server lifecycle (start, stop, health checks, port allocation) |
| `device/` | Device management (iOS simulators, Android emulators, React Native detection) |
| `webdriver/` | WebdriverIO session management, test execution, test loading |
| `utils/` | Agent-friendly test helpers (`tapButton`, `fillInput`, `expectText`, etc.) |
| `test-builder.ts` | Playwright-compatible `test()` API with `{ driver }` fixture |
| `runner.ts` | `AppiumRunner` — orchestrates config, server, session, tests, cleanup |
| `discovery.ts` | Finds `.appium.ts` and `.appium.py` test files |

**Design decisions:**
- Tests use a Playwright-like API (`test.describe`, `test.beforeEach`) for consistency
- The `driver` fixture is a WebdriverIO `Browser` instance injected automatically
- High-level helpers (`tapButton`, `fillInput`) are designed to be readable by AI agents
- Smart defaults auto-detect app path, device, and platform from React Native projects
- `appium` is a peer dependency — users install their own version

---

## packages/k6

**Purpose:** k6 load testing runner plugin. Wraps the k6 CLI with auto-discovery, script generation, and result parsing.

**Key modules:**

| Module | Description |
|---|---|
| `config.ts` | `defineK6Config()` and `loadK6Config()` — config system with sensible defaults |
| `discovery.ts` | `findK6Scripts()` — recursive `*.k6.js` file discovery |
| `executor.ts` | `executeK6()` — spawns k6 binary, captures stdout/stderr, reads JSON summary |
| `parser.ts` | `parseK6Summary()` and `toTestResults()` — extracts structured metrics from k6 output |
| `runner.ts` | `K6Runner` — implements `ZosmaPlugin`, orchestrates the full pipeline |
| `templates/` | Script generators for load, stress, spike, and soak test profiles |

**Design decisions:**
- k6 binary is a peer dependency — users install their own version
- Each `*.k6.js` script runs as an independent k6 execution
- Results are normalized to `TestResult[]` for unified reporting
- When no scripts exist but `endpoints` are configured, scripts are auto-generated from templates
- Default thresholds: p(95)<500ms response time, <1% error rate

---

## packages/cli

**Purpose:** Developer-facing UX layer. All commands delegate to underlying tools — the CLI adds prompts, colour, and discoverability, not functionality.

**Commands:**

| Command | What it does |
|---|---|
| `init` | Interactive prompts → scaffolds `tests/`, `specs/`, `playwright.config.ts`, `zosma.config.ts`, optionally runs `playwright init-agents` |
| `run` | Forwards to `npx playwright test` with any flags passed through |
| `agents init` | Prompts for AI loop (OpenCode default) → runs `npx playwright init-agents --loop=X` |
| `report` | Runs `npx playwright show-report` |

**Key principle:** The CLI never locks you in. Every command it runs is a standard tool (Playwright CLI, etc.) that you can invoke directly. The CLI is a shortcut, not a wrapper.

---

## Config System

Two layers, both optional:

```
zosma.config.ts        — top-level: plugins, testDir, baseURL, browsers
playwright.config.ts   — Playwright-specific: extends @zosmaai/zosma-qa-playwright base config
```

Config lookup order (both files):
1. `{cwd}/zosma.config.ts`
2. `{cwd}/zosma.config.js`
3. Built-in defaults

Playwright config follows standard Playwright resolution (passed explicitly or discovered automatically).

---

## AI Agent Convention

zosma-qa follows Playwright's agent conventions exactly so that agent definitions work immediately with any supported AI tool:

```
.github/agents/        ← generated by `npx playwright init-agents --loop=X`
specs/                 ← planner writes *.md test plans here
tests/seed.spec.ts     ← agent entry point; customize for your app
tests/                 ← generator writes *.spec.ts files here
playwright.config.ts   ← standard location; agents use this automatically
```

The `init` command scaffolds this structure and optionally runs `playwright init-agents`.

---

## Test Discovery

`@zosmaai/zosma-qa-core`'s `findTestFiles()` walks `testDir` recursively and returns files matching:
- `*.spec.ts`, `*.test.ts`
- `*.spec.js`, `*.test.js`

`@zosmaai/zosma-qa-appium`'s `findAppiumTests()` discovers mobile test files matching:
- `*.appium.ts`, `*.appium.js`
- `*.appium.py`

`@zosmaai/zosma-qa-k6`'s `findK6Scripts()` discovers load test scripts matching:
- `*.k6.js`

Ignored directories: `node_modules`, `dist`, `.git`, `.playwright`, `playwright-report`, `test-results`, `k6-results`.

---

## Adding a New Runner Plugin

1. Create `packages/<runner>/` with a `package.json`
2. Implement `ZosmaPlugin` from `@zosmaai/zosma-qa-core`
3. Export from the package index
4. Add the runner name to `zosma.config.ts`'s `plugins` array
5. The CLI's `run` command will pick it up

See `packages/appium/` or `packages/k6/` for complete reference implementations. Here's a minimal skeleton:

```typescript
import type { ZosmaPlugin, RunnerConfig, TestResult } from '@zosmaai/zosma-qa-core';

export class MyRunner implements ZosmaPlugin {
  readonly name = 'my-runner';

  async run(config: RunnerConfig): Promise<TestResult[]> {
    // spawn your runner and return normalized results
  }
}
```
