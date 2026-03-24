import { expect, test } from '@playwright/test';

/**
 * seed.spec.ts — AI agent entry point for the zosma.ai test suite.
 *
 * Playwright's planner/generator/healer agents use a "seed" test as the
 * starting point for exploration. The seed test sets up a ready-to-use
 * `page` context (navigation, auth, fixtures, etc.). All generated tests
 * inherit this starting state.
 *
 * Example prompt:
 *
 *   "Use the planner agent. Seed: tests/seed.spec.ts.
 *    Generate a plan for the contact form flow on zosma.ai."
 */
test('seed', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/zosma/i);
});
