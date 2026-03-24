# Getting Started with Playwright (Web Testing)

This guide covers setting up zosma-qa for browser-based end-to-end and component testing using Playwright.

---

## Prerequisites

- **Node.js** >= 18
- **npm**, **pnpm**, or **yarn**

---

## Option A: Interactive Setup (Recommended)

```bash
npx zosma-qa init
```

The CLI will prompt you for:

1. **Project name** — leave blank to scaffold in the current directory
2. **Language** — choose TypeScript
3. **Base URL** — the URL of the app you want to test (e.g., `https://www.myapp.com`)
4. **Browsers** — chromium (default), firefox, webkit
5. **AI agents** — OpenCode (default), Claude Code, VS Code, or skip

This creates:

```
tests/seed.spec.ts         ← starter test + AI agent entry point
specs/.gitkeep             ← AI planner output directory
playwright.config.ts       ← extends @zosmaai/zosma-qa-playwright base config
zosma.config.ts            ← top-level zosma-qa config
.github/agents/.gitkeep    ← AI agent definitions directory
package.json               ← created if missing, deps installed automatically
```

### Run your tests

```bash
npx zosma-qa run
```

### Open the report

```bash
npx zosma-qa report
```

---

## Option B: Add to an Existing Project

```bash
npm install -D @zosmaai/zosma-qa-playwright @playwright/test
npx playwright install
```

Create a `playwright.config.ts`:

```typescript
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: {
    baseURL: 'https://www.myapp.com',
  },
  browsers: ['chromium', 'firefox', 'webkit'],
});
```

The `defineConfig()` function wraps Playwright's config with production-ready defaults:

| Setting | CI | Local |
|---|---|---|
| `fullyParallel` | `true` | `true` |
| `retries` | `2` | `0` |
| `workers` | `1` | auto |
| `reporter` | html + github + list | html + list |
| `trace` | on-first-retry | on-first-retry |
| `screenshot` | only-on-failure | only-on-failure |
| `video` | retain-on-failure | retain-on-failure |

All standard Playwright options are supported — override anything you need:

```typescript
export default defineConfig({
  use: { baseURL: 'https://staging.myapp.com' },
  browsers: ['chromium'],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  testDir: './e2e',
});
```

---

## Writing Tests

### Standard test structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### File naming

Tests must match one of these patterns to be discovered:

- `*.spec.ts` / `*.spec.js`
- `*.test.ts` / `*.test.js`

Place them in your `testDir` (default: `./tests`).

---

## Python (pytest-playwright)

```bash
npx zosma-qa init
# Choose: Python
```

If [uv](https://docs.astral.sh/uv/) is installed, dependencies are installed automatically. Otherwise the CLI prints instructions for `venv + pip`.

```bash
playwright install
npx zosma-qa run
```

Python tests use pytest-playwright's `page` fixture:

```python
# tests/test_login.py
import re
from playwright.sync_api import Page, expect

def test_login_page(page: Page):
    page.goto("/login")
    expect(page.get_by_label(re.compile("email", re.IGNORECASE))).to_be_visible()
    expect(page.get_by_role("button", name=re.compile("sign in", re.IGNORECASE))).to_be_visible()
```

---

## AI Agents

### Setup

```bash
npx zosma-qa agents init
# Choose: OpenCode (default) / Claude Code / VS Code
```

This runs `npx playwright init-agents` and generates agent definitions in `.github/agents/`.

### Workflow

1. **Plan** — The planner agent explores your app and writes a Markdown test plan:

   ```
   Use the planner agent. Seed: tests/seed.spec.ts.
   Generate a plan for the checkout flow.
   ```

2. **Generate** — The generator agent turns a plan into test files:

   ```
   Use the generator agent with specs/checkout.md
   ```

3. **Heal** — The healer agent fixes broken locators and assertions:

   ```
   Use the healer agent on tests/checkout/add-to-cart.spec.ts
   ```

> AI agents are currently TypeScript-only.

---

## CLI Commands

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive scaffold |
| `npx zosma-qa run` | Run all tests |
| `npx zosma-qa run --grep "checkout"` | Filter by pattern |
| `npx zosma-qa run --headed` | Visible browser mode |
| `npx zosma-qa run --project firefox` | Run specific browser |
| `npx zosma-qa agents init` | Set up AI agents |
| `npx zosma-qa report` | Open HTML report |

All flags are forwarded directly to `npx playwright test`.

---

## Example Project

See [`examples/zosma-ai/`](../examples/zosma-ai/) for a complete working test suite that runs against the live [zosma.ai](https://www.zosma.ai) site.

```bash
# From the repo root
pnpm test:examples
```

---

## Next Steps

- Read the [Architecture](ARCHITECTURE.md) doc for how the packages fit together
- Read the [Vision](VISION.md) doc for the project roadmap
- Explore [mobile testing with Appium](GETTING_STARTED_APPIUM.md) for iOS and Android
