# zosma-qa — Agent Instructions

This file is automatically loaded by OpenCode, Pi, Claude Code, and any agent that follows the `AGENTS.md` standard. It gives you the full context you need to work on this project without guessing.

---

## What This Project Is

**zosma-qa** is an open-source, zero-config QA platform. Users run `npx zosma-qa init`, choose TypeScript or Python, and get a fully working Playwright test setup with AI agent support out of the box.

The project ships three publishable npm packages plus a working example test suite that runs against the live [https://www.zosma.ai](https://www.zosma.ai) site.

---

## Monorepo Structure

```
zosma-qa/                          ← pnpm workspace root
├── packages/
│   ├── core/                      ← @zosmaai/zosma-qa-core  (types, config, discovery)
│   ├── playwright/                ← @zosmaai/zosma-qa-playwright  (runner + base config)
│   └── cli/                       ← @zosmaai/zosma-qa-cli  (interactive CLI)
├── templates/
│   ├── playwright/                ← reference scaffold for TypeScript projects
│   └── playwright-python/        ← reference scaffold for Python projects
├── examples/zosma-ai/             ← working example: tests against zosma.ai
│   ├── playwright.config.ts
│   ├── tests/
│   │   ├── seed.spec.ts
│   │   ├── home.spec.ts
│   │   ├── about.spec.ts
│   │   ├── openzosma.spec.ts
│   │   └── contact.spec.ts
│   └── specs/zosma-site.md        ← AI planner spec
├── tests/                         ← root test directory (users put tests here)
├── specs/                         ← AI planner markdown output
├── .github/
│   ├── agents/                    ← Playwright agent definitions
│   └── workflows/                 ← CI/CD (ci.yml, release.yml)
└── docs/
    ├── ARCHITECTURE.md
    ├── GETTING_STARTED.md
    └── VISION.md
```

---

## Package Dependency Graph

```
@zosmaai/zosma-qa-cli
  ├── @zosmaai/zosma-qa-core
  └── @zosmaai/zosma-qa-playwright
        └── @zosmaai/zosma-qa-core
```

`@playwright/test` is a **peer dependency** of `@zosmaai/zosma-qa-playwright` — do not add it as a direct dependency.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Language | TypeScript 5, strict mode, compiled to **CommonJS** |
| Package manager | pnpm 9 (workspaces) |
| Test runner (TS) | Playwright 1.52+ |
| Test runner (Python) | pytest-playwright (dispatched via CLI) |
| Python env manager | uv (preferred) or venv + pip |
| CLI prompts | `@inquirer/prompts` (NOT the old `inquirer` package) |
| Build | `tsc` per package, `tsconfig.base.json` extended by each package |
| Lint + Format | **Biome** (`pnpm lint` / `pnpm lint:fix` / `pnpm format`) |
| Node | >=18 |

---

## Essential Commands

```bash
# Install all dependencies
pnpm install

# Build all three packages (run from repo root)
pnpm build

# Run the example test suite (zosma.ai live site, 32 tests)
pnpm test:examples

# Run only a specific spec file
cd examples/zosma-ai && pnpm exec playwright test tests/home.spec.ts

# Type-check all packages
pnpm typecheck

# Open the Playwright HTML report
pnpm report

# Lint the entire repo (Biome)
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format all files
pnpm format

# Clean build artifacts and test results
pnpm clean
```

Each package also has its own `pnpm build` / `pnpm typecheck` scripts.

---

## Code Conventions

- **TypeScript strict mode** everywhere — no `any`, no implicit `any`
- **CommonJS output** (`"module": "commonjs"` in all `tsconfig.json` files)
- All source files live under `src/`, compiled output goes to `dist/`
- `tsconfig.base.json` at the root is extended by every package
- Biome handles all linting and formatting — run `pnpm lint:fix` before committing
- Imports use `@zosmaai/zosma-qa-core` workspace aliases, not relative paths between packages
- All Node.js built-in imports use the `node:` prefix (`node:fs`, `node:path`, etc.)

### `@inquirer/prompts` — important note

The CLI uses `@inquirer/prompts` (the new modular API). The old `inquirer` + `@types/inquirer` pattern is **not used**. The `checkbox` validate callback receives `readonly NormalizedChoice<T>[]`, not `T[]`.

---

## Config System (two files, both optional)

### TypeScript projects (`plugins: ['playwright']`)

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';
export default defineConfig({ baseURL: 'https://example.com', browsers: ['chromium'] });

// playwright.config.ts — extends @zosmaai/zosma-qa-playwright base config
import { defineConfig } from '@zosmaai/zosma-qa-playwright';
export default defineConfig({ use: { baseURL: 'https://example.com' } });
```

### Python projects (`plugins: ['pytest']`)

```typescript
// zosma.config.ts — same shape; only the plugin value differs
import { defineConfig } from '@zosmaai/zosma-qa-core';
export default defineConfig({ plugins: ['pytest'], baseURL: 'https://example.com', browsers: ['chromium'] });
```

```toml
# pyproject.toml — pytest-playwright native config (no playwright.config.ts)
[tool.pytest.ini_options]
testpaths = ["tests"]
base_url = "https://example.com"
addopts = "--browser chromium"
```

Config lookup: `{cwd}/zosma.config.ts` → `{cwd}/zosma.config.js` → built-in defaults.

---

## `npx zosma-qa init` — Prompt Order

1. **Project name** — blank = scaffold in current directory; named = create subdirectory
2. **Language** — TypeScript (default) or Python
3. **Base URL** — validated for `http://https://` prefix
4. **Browsers** — checkbox, chromium checked by default
5. **AI loop** — TypeScript only; Python projects skip this with a note

### TypeScript scaffold output

```
tests/seed.spec.ts
specs/.gitkeep
playwright.config.ts
zosma.config.ts          (plugins: ['playwright'])
.github/agents/.gitkeep
package.json             (created via npm init -y if missing)
                         (deps installed: @zosmaai/zosma-qa-playwright @playwright/test)
                         (npx playwright init-agents --loop=<choice> runs if not skipped)
```

### Python scaffold output

```
tests/test_seed.py
conftest.py
pyproject.toml           (includes pytest-playwright dep, base_url, browser addopts)
zosma.config.ts          (plugins: ['pytest'])
specs/.gitkeep
.github/agents/.gitkeep
                         (uv add pytest-playwright runs if uv is available)
                         (init-agents is skipped — not yet supported for Python)
```

---

## `npx zosma-qa run` — Runner Dispatch

The `run` command reads `zosma.config` and dispatches to the appropriate runner:

| `plugins` value | Command used | uv.lock present? |
|---|---|---|
| `['playwright']` | `npx playwright test` | N/A |
| `['pytest']` | `uv run pytest <testDir>` | Yes |
| `['pytest']` | `python -m pytest <testDir>` | No |

Flag mapping for Python:

| CLI flag | pytest arg | Notes |
|---|---|---|
| `--grep <pattern>` | `-k <pattern>` | Mapped |
| `--headed` | `--headed` | Mapped |
| `--project`, `--debug`, `--workers`, `--shard`, `--reporter` | — | Silently ignored |

---

## Python Package Management (uv)

The CLI prefers `uv` for Python dependency management because modern systems (macOS 14+, Ubuntu 22.04+) reject bare `pip install` outside a virtual environment with "externally-managed-environment" errors.

- **`init` command**: checks `isUvAvailable()` via `spawnSync('uv', ['--version'])`. If true, runs `uv add pytest-playwright` automatically (creates `.venv/` and `uv.lock`). If false, prints installation instructions for both uv and venv+pip.
- **`run` command**: checks for `uv.lock` in `process.cwd()`. If present, uses `uv run pytest`. Otherwise, uses `python -m pytest`.
- **Templates**: `templates/playwright-python/pyproject.toml` is uv-compatible; `uv run` reads it natively.

---

## AI Agent Convention

This project follows Playwright's official agent convention:

```
.github/agents/        ← agent definitions (generated by `npx playwright init-agents`)
specs/                 ← planner writes *.md specs here
tests/seed.spec.ts     ← TypeScript agent entry point
tests/test_seed.py     ← Python agent entry point
playwright.config.ts   ← TypeScript projects only
```

The CLI's `agents init` command prompts for an AI loop (OpenCode is the default) and runs `npx playwright init-agents --loop=<choice>`. **This is TypeScript-only.** Python projects currently skip agent scaffolding with a note.

After `init-agents` completes, zosma-qa patches the generated planner/generator
prompts so they always save Markdown plans into the existing `specs/`
directory:

- Planner uses paths like `specs/checkout.plan.md`
- It avoids creating sibling folders like `spec/` or `plans/` when `specs/`
  already exists

### Using Playwright test agents

Playwright ships three built-in agents that work with zosma-qa's seed tests:

| Agent | Role |
|---|---|
| `planner` | explores the app starting from `tests/seed.spec.ts` and writes Markdown plans into `specs/` |
| `generator` | reads a Markdown plan and writes Playwright tests into `tests/` |
| `healer` | replays failing tests and repairs locators/assertions in-place |

Typical workflow for a TypeScript project:

1. Run `npx zosma-qa init` and keep the generated `tests/seed.spec.ts`.
2. Customise the seed to represent your real starting state (logged-in page, fixtures, etc.).
3. In your AI tool, use prompts like:

   - `Use the planner agent. Seed: tests/seed.spec.ts. Generate a plan for the checkout flow.`
   - `Use the generator agent with specs/checkout.md to create tests in tests/checkout/.`
   - `Use the healer agent on tests/checkout/confirm-order.spec.ts to repair failing locators.`

The example project under `examples/zosma-ai/` uses `tests/seed.spec.ts` in exactly this way.

---

## Writing Example Tests (examples/zosma-ai)

All example tests target the live `https://www.zosma.ai` site. Before writing or modifying a test, read the DOM patterns below — they save significant debugging time.

### Standard test boilerplate

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
    await page.waitForLoadState('networkidle'); // always include — site is Next.js
  });

  test('test name', async ({ page }) => {
    // ...
  });
});
```

Always call `waitForLoadState('networkidle')` in `beforeEach`. The site is a Next.js app with client-side hydration that can cause flaky tests without it.

---

## Live Site DOM Patterns (zosma.ai)

These are discovered truths from running tests against the real site. Do not deviate from these patterns without re-verifying.

### Navigation

The site does **not** use `role="navigation"`. The header is a plain `<header>` element.

```typescript
// CORRECT
const header = page.locator('header').first();
await header.getByRole('link', { name: /about/i }).click();

// WRONG — will always fail
await page.getByRole('navigation').getByRole('link', { name: /about/i }).click();
```

Nav links in the header: **openzosma**, **About**, **Contact**, **Book a Demo**

### Headings

Some sections render headings as non-semantic elements or lazy-load them. Always use tag-based filtering with `waitForLoadState('networkidle')`:

```typescript
// Reliable pattern for any heading
await expect(
  page.locator('h1, h2, h3').filter({ hasText: /section title/i }).first()
).toBeVisible();

// getByRole('heading') is unreliable for some sections — avoid unless verified
```

### Strict mode violations — always add `.first()`

Many text nodes appear in multiple elements (heading + paragraph). Use `.first()` or more specific locators:

```typescript
// WRONG — throws "strict mode violation: N elements matched"
await expect(page.getByText(/excellence/i)).toBeVisible();

// CORRECT
await expect(page.getByText(/excellence/i).first()).toBeVisible();
// or use heading role to be precise:
await expect(page.getByRole('heading', { name: /excellence/i })).toBeVisible();
```

### Unicode apostrophes

The site uses curly/smart apostrophes (`'` U+2019) in heading text. Regex with straight apostrophes `'` will not match them.

```typescript
// WRONG — straight apostrophe doesn't match U+2019
page.getByRole('heading', { name: /your team's ai twins/i })

// CORRECT — match on a prefix that avoids the apostrophe
page.locator('h1').filter({ hasText: /your team/i }).first()
```

### Contact form

The contact form at `/contact` uses `<label>` elements — **not** `placeholder` attributes — to identify fields:

```typescript
// CORRECT
await page.getByLabel(/full name/i).fill('...');
await page.getByLabel(/business email/i).fill('...');
await page.getByLabel(/phone number/i).fill('...');
await page.getByLabel(/organization/i).fill('...');
await page.getByLabel(/message/i).fill('...');

// WRONG — placeholders are "John Doe", "john@company.com" etc., not field names
await page.getByPlaceholder(/full name/i).fill('...');
```

The form submission is a React client-side POST. Mock it with `page.route()` to avoid sending real data:

```typescript
await page.route('**', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true }) });
  } else {
    await route.continue();
  }
});
```

The post-submit success state is pure React state — it will not be present in static HTML. Track whether a POST was fired as your success signal.

### OpenZosma page hero heading

The `<h1>` on `/openzosma` reads `Your Team's AI Twins. Always On.` The first heading in the DOM is a screen-reader-only nav label. Use `locator('h1')` with `filter`, not `getByRole`:

```typescript
await expect(page.locator('h1').filter({ hasText: /your team/i }).first()).toBeVisible();
```

---

## Adding a New Example Test Spec

1. Create `examples/zosma-ai/tests/<page>.spec.ts`
2. Use the standard boilerplate above
3. Run with: `cd examples/zosma-ai && pnpm exec playwright test tests/<page>.spec.ts`
4. Verify all 32+ tests still pass: `pnpm test:examples`

---

## Adding a New Runner Plugin (Future)

1. Create `packages/<runner>/` — copy the structure from `packages/playwright/`
2. Implement `ZosmaPlugin` from `@zosmaai/zosma-qa-core`:
   ```typescript
   import type { ZosmaPlugin, RunnerConfig, TestResult } from '@zosmaai/zosma-qa-core';
   export class MyRunner implements ZosmaPlugin {
     readonly name = 'my-runner';
     async run(config: RunnerConfig): Promise<TestResult[]> { ... }
   }
   ```
3. Add to `pnpm-workspace.yaml`
4. Add to `@zosmaai/zosma-qa-cli`'s dependencies

---

## Key Files Quick Reference

| File | Purpose |
|---|---|
| `packages/core/src/types.ts` | All shared TypeScript types |
| `packages/core/src/config.ts` | `defineConfig()` and `loadConfig()` |
| `packages/core/src/discovery.ts` | `findTestFiles()` — TS and Python patterns |
| `packages/playwright/src/base-config.ts` | Playwright base config factory |
| `packages/playwright/src/runner.ts` | `PlaywrightRunner` plugin class |
| `packages/cli/src/commands/init.ts` | Interactive `init` command — TypeScript + Python scaffolds |
| `packages/cli/src/commands/run.ts` | `run` command — dispatches to playwright or pytest |
| `packages/cli/src/commands/agents.ts` | `agents init` with AI loop selection |
| `examples/zosma-ai/playwright.config.ts` | Example project Playwright config |
| `templates/playwright/` | Reference scaffold for TypeScript projects |
| `templates/playwright-python/` | Reference scaffold for Python projects |
| `tsconfig.base.json` | Root TypeScript config extended by all packages |
| `biome.json` | Biome lint + format config |
| `.env.example` | Required environment variables |

---

## What Not To Do

- Do not run `git init` or make commits — the user manages git
- Do not add `"module": "ESModule"` to any tsconfig — output must be CommonJS
- Do not import `inquirer` directly — always use `@inquirer/prompts`
- Do not add `role="navigation"` assertions — the site does not use it
- Do not use `getByPlaceholder` for the contact form — use `getByLabel`
- Do not add real contact form submissions in tests — always mock the POST
- Do not read from `templates/playwright-python/` at runtime — `init.ts` uses inline template functions, not the template files
- Do not run `npx playwright init-agents` for Python projects — it requires TypeScript/Node.js Playwright setup
- Do not use `pip install` directly in the CLI without a venv — it will fail on modern systems; use `uv add` or print instructions instead
