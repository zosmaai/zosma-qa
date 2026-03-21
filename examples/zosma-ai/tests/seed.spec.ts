import { test, expect } from '@playwright/test';

/**
 * seed.spec.ts — AI agent entry point for the zosma.ai test suite.
 *
 * When using the Playwright planner/generator/healer agents, include
 * this file as the seed:
 *
 *   "Use the planner agent. Seed: tests/seed.spec.ts.
 *    Generate a plan for the contact form flow."
 *
 * This test provides a ready-to-use `page` context pointed at the
 * homepage, so all generated tests inherit the same starting state.
 */
test('seed', async ({ page }) => {
  await page.goto('/');

  // Verify the site is up and the main brand is present
  await expect(page).toHaveTitle(/Zosma/i);
  await expect(page.getByRole('img', { name: /zosma/i }).first()).toBeVisible();
});
