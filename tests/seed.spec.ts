import { expect, test } from '@playwright/test';

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
 *
 * ─── How to activate ───────────────────────────────────────────────────────
 * Set the BASE_URL environment variable (or update playwright.config.ts) to
 * point at your app before running this test:
 *
 *   BASE_URL=https://myapp.example.com pnpm test
 *
 * Until then, this test is skipped automatically to avoid CI failures.
 */

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const isConfigured = !baseURL.includes('localhost');

test('seed', async ({ page }) => {
  test.skip(
    !isConfigured,
    'BASE_URL is not configured — set BASE_URL to your app URL to activate this test.',
  );

  await page.goto('/');

  // Update this to match your app's title
  await expect(page).toHaveTitle(/.+/);
});
