import { test, expect } from '@playwright/test';

/**
 * seed.spec.ts — root AI agent entry point.
 *
 * Replace the baseURL and title assertion below to match your app,
 * then use this file as the seed when prompting your AI agent:
 *
 *   "Use the planner agent. Seed: tests/seed.spec.ts.
 *    Generate a plan for the login and dashboard flow."
 *
 * Run `npx zosma-qa agents init` to set up the agent definitions first.
 */
test('seed', async ({ page }) => {
  // baseURL is configured in playwright.config.ts
  await page.goto('/');

  // Update this to match your app's title
  await expect(page).toHaveTitle(/.+/);
});
