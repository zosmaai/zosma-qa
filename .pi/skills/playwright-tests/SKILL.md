# Playwright Tests — zosma-qa Skill

Use this skill when the user asks you to write, fix, or review Playwright tests in this project — especially tests under `examples/zosma-ai/tests/`.

---

## When to load this skill

- Writing a new `*.spec.ts` file under `examples/zosma-ai/tests/`
- Debugging a failing or flaky test in the example suite
- Reviewing locators or assertions in any zosma-qa test file
- Asked about `pnpm test:examples` or Playwright config

---

## Steps

### 1. Understand the target page

All example tests hit the live `https://www.zosma.ai` site (a Next.js app). Read the existing spec files in `examples/zosma-ai/tests/` to understand the patterns already established before writing new ones.

### 2. Use the standard boilerplate

Every spec file must follow this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Page name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
    await page.waitForLoadState('networkidle'); // REQUIRED — Next.js hydration
  });

  test('test name', async ({ page }) => {
    // assertions here
  });
});
```

`waitForLoadState('networkidle')` in `beforeEach` is **mandatory** — omitting it causes flaky failures on this Next.js site.

### 3. Apply the correct locator strategy

#### Navigation — use `<header>`, not `role="navigation"`

```typescript
// CORRECT
const header = page.locator('header').first();
await header.getByRole('link', { name: /contact/i }).click();

// WRONG — the site has no role="navigation"
await page.getByRole('navigation').getByRole('link', { name: /contact/i }).click();
```

Nav links: `openzosma`, `About`, `Contact`, `Book a Demo`

#### Headings — use tag + filter, not `getByRole('heading')`

Some headings are non-semantic or lazy-loaded. Prefer:

```typescript
await expect(
  page.locator('h1, h2, h3').filter({ hasText: /section title/i }).first()
).toBeVisible();
```

#### Strict-mode violations — always add `.first()`

If text appears in both a heading and a paragraph, `getByText()` will throw a strict-mode error. Always add `.first()` or scope to a role:

```typescript
await expect(page.getByText(/excellence/i).first()).toBeVisible();
// or
await expect(page.getByRole('heading', { name: /excellence/i })).toBeVisible();
```

#### Unicode apostrophes

The site uses curly apostrophes (`'` U+2019). Match on a prefix that avoids the character:

```typescript
// WRONG
page.getByRole('heading', { name: /your team's ai twins/i })

// CORRECT
page.locator('h1').filter({ hasText: /your team/i }).first()
```

#### Contact form — use `getByLabel`, not `getByPlaceholder`

Fields have labels (`Full Name`, `Business Email`, `Phone Number`, `Organization`, `Message`). Placeholders are generic (`John Doe`, `john@company.com`, etc.).

```typescript
await page.getByLabel(/full name/i).fill('Test User');
await page.getByLabel(/business email/i).fill('test@example.com');
await page.getByLabel(/phone number/i).fill('9876543210');
await page.getByLabel(/organization/i).fill('Test Org');
await page.getByLabel(/message/i).fill('Test message');
```

Always mock form submissions — never send real data:

```typescript
await page.route('**', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  } else {
    await route.continue();
  }
});
```

The post-submit success UI is pure React state. Track that a POST was fired as your success signal rather than waiting for visible text.

### 4. Run and verify

After writing or editing a spec:

```bash
# Run the single file quickly
cd examples/zosma-ai && pnpm exec playwright test tests/<file>.spec.ts

# Verify the full suite still passes (32 tests)
pnpm test:examples
```

If a test fails, read the error carefully:
- `strict mode violation` → add `.first()` or use a more specific locator
- `element not found` → the element may lazy-load; ensure `waitForLoadState('networkidle')` ran
- `locator resolved to N elements` → same as strict-mode violation
- Timeout on heading → switch from `getByRole('heading')` to `locator('h1, h2, h3').filter()`

### 5. Do not

- Use `getByRole('navigation')` — the site has no such landmark
- Use `getByPlaceholder` for the contact form — use `getByLabel`
- Send real form submissions — always mock with `page.route()`
- Skip `waitForLoadState('networkidle')` in `beforeEach`
- Add straight-apostrophe regex for headings with curly apostrophes
