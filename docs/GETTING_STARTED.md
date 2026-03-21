# Getting Started

## Prerequisites

- Node.js 18+
- pnpm 9+ (`npm install -g pnpm`)
- Git

---

## Option A — Clone zosma-qa and add your tests

This is the recommended approach. You get the full repo, including the working
example tests and all infrastructure.

### 1. Clone

```bash
git clone https://github.com/zosmaai/zosma-qa.git
cd zosma-qa
```

### 2. Install dependencies

```bash
pnpm install
npx playwright install
```

### 3. Configure for your app

Run the interactive init command. It will ask for your app's URL, which browsers
to test, and which AI tool you use:

```bash
npx zosma-qa init
```

Example session:

```
  zosma-qa — zero-config QA platform

  ? Base URL of the app under test: https://www.myapp.com
  ? Which browsers to test?
    ❯ ◉ Chromium  (recommended)
      ○ Firefox
      ○ WebKit  (Safari)
  ? Set up AI agents for test generation?
    ❯ ◉ OpenCode  (default)
      ○ Claude Code
      ○ VS Code  (Copilot)
      ○ Skip for now

  ✓ Created  tests/seed.spec.ts
  ✓ Created  specs/  (AI planner writes test plans here)
  ✓ Created  playwright.config.ts
  ✓ Created  zosma.config.ts
  ✓ Agent definitions written to .github/agents/  (loop: opencode)

  Ready!  Here's what to do next:
    npx zosma-qa run          run your tests
    npx zosma-qa agents init  re-run agent setup for a different AI tool
    npx zosma-qa report       open the HTML report
```

### 4. Add your tests

Put your Playwright test files in the `tests/` directory:

```
tests/
  seed.spec.ts         ← already scaffolded; AI agent entry point
  login.spec.ts        ← your tests
  checkout.spec.ts
  dashboard/
    metrics.spec.ts
```

### 5. Run

```bash
npx zosma-qa run
```

After the run, an HTML report opens automatically. Re-open it anytime:

```bash
npx zosma-qa report
```

---

## Option B — Install as a package in your own project

```bash
npm install -D @zosmaai/zosma-qa-playwright @zosmaai/zosma-qa-cli @playwright/test
npx playwright install
```

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: {
    baseURL: 'https://www.myapp.com',
  },
  browsers: ['chromium', 'firefox'],
});
```

Run:

```bash
npx zosma-qa run
```

---

## Using AI Agents

### What the agents do

| Agent | Role |
|---|---|
| **planner** | Browses your app → produces a Markdown test plan in `specs/` |
| **generator** | Reads a Markdown plan → writes Playwright test files in `tests/` |
| **healer** | Runs failing tests → automatically repairs locators and assertions |

### Set up (if not done during init)

```bash
npx zosma-qa agents init
```

Choose your AI tool. OpenCode is the default. Agent definitions are written to
`.github/agents/` — commit these files so your team shares the same agent setup.

### Customise the seed test

Open `tests/seed.spec.ts` and point it at your app's real entry state. Add
authentication, custom fixtures, or any global setup your tests need:

```typescript
// tests/seed.spec.ts
import { test, expect } from '@playwright/test';

test('seed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByLabel('Email').fill('admin@myapp.com');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

### Generate tests with the planner

Prompt your AI tool (OpenCode, Claude, or VS Code Copilot):

```
Use the planner agent. Seed: tests/seed.spec.ts.
Generate a plan for the checkout flow — add item to cart,
proceed to checkout, fill shipping details, confirm order.
```

The planner will explore your app and write `specs/checkout.md`.

### Generate test code with the generator

```
Use the generator agent with specs/checkout.md
```

Test files appear in `tests/checkout/`.

### Heal failing tests

```
Use the healer agent on tests/checkout/confirm-order.spec.ts
```

The healer replays the failing steps, inspects the current DOM, and patches
the test until it passes.

---

## Docker

Run tests in a clean, reproducible Playwright environment:

```bash
# Build and run tests
docker compose up

# Run against a specific URL
BASE_URL=https://staging.myapp.com docker compose up

# Run the zosma.ai example suite
docker compose --profile examples up tests-examples
```

---

## CI/CD

The included GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every
push and pull request:

1. Builds all packages
2. Installs Playwright browsers
3. Runs root tests + example tests
4. Uploads HTML reports as artifacts (retained 30 days)

To set the base URL for CI, add a repository variable:

```
Settings → Variables → Actions → New repository variable
Name:  BASE_URL
Value: https://staging.myapp.com
```

---

## Running the zosma.ai Example

A complete working example lives in `examples/zosma-ai/`. It tests the public
zosma.ai website — all pages, navigation, and the contact form with a mocked
network submission.

```bash
# Run the examples
pnpm test:examples

# Or headed for visual debugging
npx playwright test \
  --config examples/zosma-ai/playwright.config.ts \
  --headed
```

See `examples/zosma-ai/specs/zosma-site.md` for the full test plan.
