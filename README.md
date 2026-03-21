# zosma-qa

**Zero-config QA platform — Playwright, AI agents, and extensible test runners.**

Drop your tests in. Everything works.

[![CI](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml/badge.svg)](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## What is zosma-qa?

zosma-qa is an open-source QA framework that gives you a production-ready test infrastructure in minutes. It ships with:

- **Best-practice Playwright config** — retries, traces, screenshots, video, and HTML reports all configured for you
- **First-class AI agent support** — Playwright's planner, generator, and healer agents work out of the box
- **Interactive CLI** (`npx zosma-qa`) — init, run, agent setup, and report commands with friendly prompts
- **Zero boilerplate** — clone the repo, add tests to `tests/`, run
- **Docker support** — fully reproducible test runs in one command
- **Extensible plugin architecture** — built for future runners: k6, Artillery, REST, accessibility

---

## Quick Start

### Option A — Clone and run (recommended)

```bash
git clone https://github.com/zosmaai/zosma-qa.git
cd zosma-qa
pnpm install
npx playwright install

# Configure for your app (interactive)
npx zosma-qa init

# Add your tests to tests/
# then run
npx zosma-qa run
```

### Option B — Use as a base config in your own project

```bash
npm install -D @zosma-qa/playwright @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@zosma-qa/playwright';

export default defineConfig({
  use: { baseURL: 'https://www.myapp.com' },
  browsers: ['chromium', 'firefox'],
});
```

---

## CLI Reference

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive scaffold — configures baseURL, browsers, and AI agents |
| `npx zosma-qa run` | Run all tests (delegates to Playwright, all flags forwarded) |
| `npx zosma-qa run --project firefox` | Run tests in a specific browser |
| `npx zosma-qa run --grep "checkout"` | Run tests matching a pattern |
| `npx zosma-qa run --headed` | Run tests in headed (visible) browser mode |
| `npx zosma-qa agents init` | Set up Playwright AI agent definitions |
| `npx zosma-qa report` | Open the HTML report in the browser |

---

## AI Agents

zosma-qa is designed for Playwright's built-in AI agents: **planner**, **generator**, and **healer**.

### Set up

```bash
npx zosma-qa agents init
# Prompts: OpenCode (default) / Claude Code / VS Code
```

### Use

Once set up, prompt your AI tool:

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

The agent definitions live in `.github/agents/` and follow Playwright's conventions:

```
.github/agents/    ← agent definitions (auto-generated, commit these)
specs/             ← planner writes .md test plans here
tests/             ← generator writes .spec.ts files here
tests/seed.spec.ts ← AI agent entry point (configure this for your app)
```

---

## Example: testing zosma.ai

A complete, working example is in `examples/zosma-ai/`. It covers:

| Test file | What it tests |
|---|---|
| `tests/seed.spec.ts` | Homepage loads, brand visible — AI agent entry point |
| `tests/home.spec.ts` | Hero, nav, CTA, How It Works, FAQ, footer |
| `tests/about.spec.ts` | Team cards, Our Story, Our Values |
| `tests/openzosma.spec.ts` | Product page, GitHub links, tech stack, terminal snippet |
| `tests/contact.spec.ts` | Full form fill + submit (network mocked — no real data sent) |

```bash
# Run the example suite
pnpm test:examples
```

---

## Docker

```bash
# Run tests in a clean Playwright container
docker compose up

# Run against a different URL
BASE_URL=https://staging.myapp.com docker compose up

# Run the zosma.ai examples
docker compose --profile examples up tests-examples
```

---

## Configuration

Two config files, both optional:

**`playwright.config.ts`** — Playwright-specific settings:

```typescript
import { defineConfig } from '@zosma-qa/playwright';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
  browsers: ['chromium', 'firefox', 'webkit'],
  // webServer: { command: 'npm run dev', url: 'http://localhost:3000' }
});
```

**`zosma.config.ts`** — Top-level runner settings:

```typescript
import { defineConfig } from '@zosma-qa/core';

export default defineConfig({
  plugins: ['playwright'], // future: ['k6', 'artillery']
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  browsers: ['chromium'],
});
```

---

## Monorepo Structure

```
zosma-qa/
├── packages/
│   ├── core/          @zosma-qa/core     — types, config loader, plugin interface
│   ├── playwright/    @zosma-qa/playwright — base config, runner plugin
│   └── cli/           @zosma-qa/cli      — `npx zosma-qa` CLI
├── templates/playwright/                  — scaffold for `init` command
├── examples/zosma-ai/                     — working tests against zosma.ai
├── tests/                                 — your tests go here
├── specs/                                 — AI planner output goes here
├── .github/agents/                        — Playwright agent definitions
└── docs/
```

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Vision](docs/VISION.md)

---

## Contributing

Contributions are welcome. Please open an issue before submitting a large PR.

## License

Apache 2.0 — see [LICENSE](LICENSE).
