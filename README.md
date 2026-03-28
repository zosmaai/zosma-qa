# zosma-qa

**The open-source QA platform — Web, Mobile, Backend, and Load testing. Zero config. AI-native.**

Drop your tests in. Everything works.

[![CI](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml/badge.svg)](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm: zosma-qa](https://img.shields.io/npm/v/zosma-qa?label=zosma-qa)](https://www.npmjs.com/package/zosma-qa)

---

## What is zosma-qa?

zosma-qa is a unified QA framework that gives you production-ready test infrastructure in minutes — across your entire stack. One CLI, one config, every test type.

| Test Type | Runner | Status |
|---|---|---|
| **Web (E2E & Component)** | Playwright | Available |
| **Mobile (iOS & Android)** | Appium + WebdriverIO | Available |
| **Load & Performance** | k6 | Available |
| **Load & Performance** | Artillery | Planned |
| **REST API** | Supertest / Pactum | Planned |
| **Accessibility** | axe-core + Playwright | Planned |
| **Visual Regression** | Percy / Chromatic | Planned |

### Why zosma-qa?

- **Zero boilerplate** — `npx zosma-qa init`, answer a few questions, start testing
- **TypeScript and Python** — pick your language at init time
- **First-class AI agent support** — planner, generator, and healer agents work out of the box
- **Extensible plugin architecture** — every runner implements a shared `ZosmaPlugin` interface
- **One command** — `npx zosma-qa run` dispatches to the right runner automatically

---

## Packages

| Package | npm | Description |
|---|---|---|
| [`zosma-qa`](packages/zosma-qa/) | [![npm](https://img.shields.io/npm/v/zosma-qa)](https://www.npmjs.com/package/zosma-qa) | CLI entry point (`npx zosma-qa`) |
| [`@zosmaai/zosma-qa-core`](packages/core/) | [![npm](https://img.shields.io/npm/v/@zosmaai/zosma-qa-core)](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) | Shared types, config loader, plugin interface |
| [`@zosmaai/zosma-qa-playwright`](packages/playwright/) | [![npm](https://img.shields.io/npm/v/@zosmaai/zosma-qa-playwright)](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) | Playwright runner and base config |
| [`@zosmaai/zosma-qa-cli`](packages/cli/) | [![npm](https://img.shields.io/npm/v/@zosmaai/zosma-qa-cli)](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) | Interactive CLI with prompts |
| [`@zosmaai/zosma-qa-appium`](packages/appium/) | [![npm](https://img.shields.io/npm/v/@zosmaai/zosma-qa-appium)](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) | Appium mobile testing runner |
| [`@zosmaai/zosma-qa-k6`](packages/k6/) | [![npm](https://img.shields.io/npm/v/@zosmaai/zosma-qa-k6)](https://www.npmjs.com/package/@zosmaai/zosma-qa-k6) | k6 load testing runner |

---

## Quick Start

### Web Testing (Playwright)

```bash
npx zosma-qa init
# Choose: TypeScript → enter your base URL → pick browsers → set up AI agents
npx zosma-qa run
npx zosma-qa report
```

**Or install as a dependency in an existing project:**

```bash
npm install -D @zosmaai/zosma-qa-playwright @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: { baseURL: 'https://www.myapp.com' },
  browsers: ['chromium', 'firefox'],
});
```

See the full guide: [Getting Started with Playwright](docs/GETTING_STARTED_PLAYWRIGHT.md)

---

### Mobile Testing (Appium)

Test iOS and Android apps with a Playwright-like API:

```bash
npm install -D @zosmaai/zosma-qa-appium
```

```typescript
// tests/login.appium.ts
import { test } from '@zosmaai/zosma-qa-appium';
import { tapButton, fillInput, expectText } from '@zosmaai/zosma-qa-appium';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ driver }) => {
    await fillInput(driver, 'user@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await expectText(driver, 'Welcome back');
  });
});
```

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'localhost',
  browsers: ['chromium'],
});
```

See the full guide: [Getting Started with Appium](docs/GETTING_STARTED_APPIUM.md)

---

### Python (pytest-playwright)

```bash
npx zosma-qa init
# Choose: Python
```

If [uv](https://docs.astral.sh/uv/) is installed, `pytest-playwright` is installed automatically. Otherwise the CLI prints setup instructions.

```bash
playwright install
npx zosma-qa run        # auto-detects uv.lock → uses `uv run pytest`
```

Scaffolded files:

```
tests/test_seed.py   ← seed test with page fixture
conftest.py          ← shared fixtures
pyproject.toml       ← pytest config + pytest-playwright dependency
zosma.config.ts      ← plugins: ['pytest']
```

---

### Load Testing (k6)

```bash
npm install -D @zosmaai/zosma-qa-k6
```

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['k6'],
  testDir: './k6',
  baseURL: 'http://localhost:3000',
});
```

Write k6 scripts in `./k6/` (e.g. `smoke.k6.js`) or let the runner auto-generate them from endpoint configs.

```bash
npx zosma-qa run
```

See the full guide: [Getting Started with Load Testing](docs/GETTING_STARTED_LOAD_TESTING.md)

---

## CLI Reference

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive scaffold — language, baseURL, browsers, AI agents |
| `npx zosma-qa run` | Run all tests (auto-detects runner from config) |
| `npx zosma-qa run --grep "checkout"` | Run tests matching a pattern |
| `npx zosma-qa run --headed` | Run in headed (visible) browser mode |
| `npx zosma-qa run --project firefox` | TypeScript only — run a specific browser project |
| `npx zosma-qa agents init` | Set up Playwright AI agent definitions (TypeScript only) |
| `npx zosma-qa report` | Open the HTML report in the browser |

---

## AI Agents

zosma-qa integrates with Playwright's built-in AI agents: **planner**, **generator**, and **healer**.

> AI agent scaffolding is currently TypeScript-only. Python projects can still use AI tools directly with `tests/test_seed.py` as the entry point.

### Setup

```bash
npx zosma-qa agents init
# Prompts: OpenCode (default) / Claude Code / VS Code
```

### Usage

```
Use the planner agent. Seed: tests/seed.spec.ts.
Generate a plan for the guest checkout flow.
```

```
Use the generator agent with specs/checkout.md
```

```
Use the healer agent on tests/checkout/add-to-cart.spec.ts
```

Agent definitions are stored in `.github/agents/` following Playwright conventions.

---

## Examples

### Web: testing zosma.ai

A complete Playwright test suite is in [`examples/zosma-ai/`](examples/zosma-ai/):

| Test file | What it tests |
|---|---|
| `tests/seed.spec.ts` | Homepage loads, brand visible — AI agent entry point |
| `tests/home.spec.ts` | Hero, nav, CTA, How It Works, FAQ, footer |
| `tests/about.spec.ts` | Team cards, Our Story, Our Values |
| `tests/openzosma.spec.ts` | Product page, GitHub links, tech stack |
| `tests/contact.spec.ts` | Full form fill + submit (network mocked) |

```bash
pnpm test:examples
```

### Mobile: Appium demo

A sample Appium test project is in [`examples/appium-demo/`](examples/appium-demo/). It demonstrates test structure, fixtures, and agent-friendly helpers for React Native apps.

```bash
cd examples/appium-demo
cat tests/login.appium.ts
```

See the [example README](examples/appium-demo/README.md) for prerequisites and setup.

---

## Configuration

### TypeScript projects (Playwright)

```typescript
// playwright.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000' },
  browsers: ['chromium', 'firefox', 'webkit'],
});
```

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['playwright'],
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  browsers: ['chromium'],
});
```

### Mobile projects (Appium)

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'localhost',
  browsers: ['chromium'],
});
```

### Python projects

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
base_url = "http://localhost:3000"
addopts = "--browser chromium"
```

---

## Monorepo Structure

```
zosma-qa/
├── packages/
│   ├── core/          @zosmaai/zosma-qa-core        — types, config, plugin interface
│   ├── playwright/    @zosmaai/zosma-qa-playwright   — Playwright runner + base config
│   ├── appium/        @zosmaai/zosma-qa-appium       — Appium mobile runner + test helpers
│   ├── k6/            @zosmaai/zosma-qa-k6           — k6 load testing runner
│   ├── cli/           @zosmaai/zosma-qa-cli          — interactive CLI
│   └── zosma-qa/      zosma-qa                       — CLI entry point wrapper
├── templates/
│   ├── playwright/                — TypeScript scaffold
│   └── playwright-python/        — Python scaffold
├── examples/
│   ├── zosma-ai/                  — Playwright tests against zosma.ai
│   └── appium-demo/               — Appium mobile test examples
├── tests/                         — your tests go here
├── specs/                         — AI planner output
├── .github/
│   ├── agents/                    — Playwright agent definitions
│   └── workflows/                 — CI/CD (ci.yml, release.yml)
└── docs/
```

---

## Docs

### Getting Started Guides

- [Getting Started with Playwright](docs/GETTING_STARTED_PLAYWRIGHT.md) — web & component testing
- [Getting Started with Appium](docs/GETTING_STARTED_APPIUM.md) — iOS & Android mobile testing
- [Getting Started with Load Testing](docs/GETTING_STARTED_LOAD_TESTING.md) — k6 & Artillery (planned)

### Reference

- [Architecture](docs/ARCHITECTURE.md)
- [Getting Started (General)](docs/GETTING_STARTED.md)
- [Vision & Roadmap](docs/VISION.md)

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

## License

Apache 2.0 — see [LICENSE](LICENSE).
