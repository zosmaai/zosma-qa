import { test, expect } from '@playwright/test';

/**
 * seed.spec.ts — entry point for Playwright AI agents.
 *
 * This test bootstraps the page context that the planner, generator,
 * and healer agents use as their starting point. It runs your app's
 * global setup, project dependencies, and any fixtures you define.
 *
 * ─── How to use with AI agents ────────────────────────────────────────
 *
 *   1. Set up agents (if you haven't already):
 *        npx zosma-qa agents init
 *
 *   2. Prompt your AI tool — examples:
 *        "Use the planner agent. Seed: tests/seed.spec.ts.
 *         Generate a plan for the checkout flow."
 *
 *        "Use the generator agent with specs/checkout.md"
 *
 *        "Use the healer agent on tests/checkout/add-to-cart.spec.ts"
 *
 * ─── Customise this file ──────────────────────────────────────────────
 *
 *   Replace the goto() URL with your app's entry point, add auth steps,
 *   or import your custom fixtures — the agents will inherit everything.
 *
 * ─── Activate ─────────────────────────────────────────────────────────
 *
 *   Set BASE_URL (or update playwright.config.ts) to point at your app.
 *   The test skips automatically until then to avoid CI failures on a
 *   freshly cloned repo.
 *
 *     BASE_URL=https://myapp.example.com npx zosma-qa run
 */

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const isConfigured = !baseURL.includes('localhost');

test('seed', async ({ page }) => {
  test.skip(!isConfigured, 'BASE_URL is not configured — set BASE_URL to your app URL to activate this test.');

  // Navigate to the app under test.
  // baseURL is set in playwright.config.ts — no need to hardcode it here.
  await page.goto('/');

  // Verify the page loaded. Update this assertion to match your app's title.
  await expect(page).toHaveTitle(/.+/);
});
