# zosma-qa

**Zero-config QA platform — Playwright, AI agents, and extensible test runners.**

Drop your tests in. Everything works.

[![CI](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml/badge.svg)](https://github.com/zosmaai/zosma-qa/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

---

## What is zosma-qa?

zosma-qa is an open-source QA framework that gives you a production-ready test infrastructure in minutes. It ships with:

- **TypeScript and Python support** — pick your language at init time
- **Best-practice Playwright config** — retries, traces, screenshots, video, and HTML reports all configured for you
- **First-class AI agent support** — Playwright's planner, generator, and healer agents work out of the box
- **Interactive CLI** (`npx zosma-qa`) — init, run, agent setup, and report commands with friendly prompts
- **Zero boilerplate** — run `npx zosma-qa init`, answer a few questions, start writing tests
- **Extensible plugin architecture** — built for future runners: k6, Artillery, REST, accessibility

---

## Quick Start

```bash
npx zosma-qa init
```

The CLI will ask you:

1. **Project name** — blank to scaffold in the current directory
2. **Language** — TypeScript or Python
3. **Base URL** — the URL of the app you want to test
4. **Browsers** — chromium (default), firefox, webkit
5. **AI agents** — TypeScript only; choose OpenCode, Claude Code, VS Code, or skip

---

## TypeScript (Playwright)

```bash
npx zosma-qa init
# Choose: TypeScript

# Run your tests
npx zosma-qa run

# Open the HTML report
npx zosma-qa report
```

**Use as a base config in your own project:**

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

---

## Python (pytest-playwright)

```bash
npx zosma-qa init
# Choose: Python
```

**If [uv](https://docs.astral.sh/uv/) is installed**, `pytest-playwright` is installed automatically. If not, the CLI prints clear setup instructions for both uv and venv+pip.

```bash
# Download browser binaries
playwright install

# Run your tests
npx zosma-qa run        # auto-detects uv.lock and uses `uv run pytest`
# or directly:
uv run pytest tests/test_seed.py
```

**Scaffolded files:**

```
tests/test_seed.py   ← seed test, uses pytest-playwright's page fixture
conftest.py          ← shared fixtures placeholder
pyproject.toml       ← pytest config + pytest-playwright dependency
zosma.config.ts      ← zosma layer config (plugins: ['pytest'])
```

**`pyproject.toml` (example):**

```toml
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.9"
dependencies = ["pytest-playwright>=0.5.0"]

[tool.pytest.ini_options]
testpaths = ["tests"]
base_url = "https://www.myapp.com"
addopts = "--browser chromium"
```

---

## CLI Reference

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive scaffold — language, baseURL, browsers, AI agents |
| `npx zosma-qa run` | Run all tests (auto-detects TypeScript or Python) |
| `npx zosma-qa run --grep "checkout"` | Run tests matching a pattern |
| `npx zosma-qa run --headed` | Run in headed (visible) browser mode |
| `npx zosma-qa run --project firefox` | TypeScript only — run a specific browser project |
| `npx zosma-qa agents init` | Set up Playwright AI agent definitions (TypeScript only) |
| `npx zosma-qa report` | Open the HTML report in the browser |

---

## AI Agents

zosma-qa is designed for Playwright's built-in AI agents: **planner**, **generator**, and **healer**.

> **Note:** AI agent scaffolding (`npx playwright init-agents`) is currently TypeScript-only. Python projects can still use AI tools directly with `tests/test_seed.py` as the entry point.

### Set up (TypeScript)

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
tests/             ← generator writes test files here
tests/seed.spec.ts ← TypeScript AI agent entry point
tests/test_seed.py ← Python AI agent entry point
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

## Configuration

### TypeScript projects

**`playwright.config.ts`** — Playwright-specific settings:

```typescript
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
  browsers: ['chromium', 'firefox', 'webkit'],
});
```

**`zosma.config.ts`** — Top-level runner settings:

```typescript
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['playwright'],
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  browsers: ['chromium'],
});
```

### Python projects

**`pyproject.toml`** — pytest-playwright native config:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
base_url = "http://localhost:3000"
addopts = "--browser chromium"
```

**`zosma.config.ts`** — Top-level runner settings (same shape, different plugin):

```typescript
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['pytest'],
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
│   ├── core/          @zosmaai/zosma-qa-core      — types, config loader, plugin interface
│   ├── playwright/    @zosmaai/zosma-qa-playwright — base config, runner plugin
│   └── cli/           @zosmaai/zosma-qa-cli        — `npx zosma-qa` CLI
├── templates/
│   ├── playwright/                — reference scaffold for TypeScript projects
│   └── playwright-python/        — reference scaffold for Python projects
├── examples/zosma-ai/             — working tests against zosma.ai
├── tests/                         — your tests go here
├── specs/                         — AI planner output goes here
├── .github/agents/                — Playwright agent definitions
└── docs/
```

---

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Getting Started](docs/GETTING_STARTED.md)
- [Vision](docs/VISION.md)

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

## License

Apache 2.0 — see [LICENSE](LICENSE).
