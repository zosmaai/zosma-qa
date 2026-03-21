# New Playwright test spec for zosma-qa

Create a new Playwright test spec file at `examples/zosma-ai/tests/{{page}}.spec.ts` that tests the `/{{route}}` page of the live `https://www.zosma.ai` site.

## Requirements

1. Use this exact boilerplate to start:

```typescript
import { test, expect } from '@playwright/test';

test.describe('{{Page name}}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/{{route}}');
    await page.waitForLoadState('networkidle');
  });
});
```

2. Add tests for the following behaviour on this page: {{what to test}}

3. Follow all rules in `AGENTS.md` under "Live Site DOM Patterns":
   - Scope nav assertions to `page.locator('header').first()` — never `getByRole('navigation')`
   - Use `locator('h1, h2, h3').filter({ hasText: /.../ }).first()` for headings
   - Add `.first()` to any `getByText()` that might match more than one element
   - Use `getByLabel()` for form fields, never `getByPlaceholder()`
   - Mock all POST requests with `page.route()` if the page has a form

4. After writing the file, run it to verify it passes:
   ```bash
   cd examples/zosma-ai && pnpm exec playwright test tests/{{page}}.spec.ts
   ```

5. Then run the full suite to confirm nothing regressed:
   ```bash
   pnpm test:examples
   ```

Fix any failures before finishing.
