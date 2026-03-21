import { expect, test } from '@playwright/test';

// spec: specs/zosma-site.md
// seed: tests/seed.spec.ts

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page title identifies the brand', async ({ page }) => {
    await expect(page).toHaveTitle(/Zosma/i);
  });

  test('navigation bar contains all top-level links', async ({ page }) => {
    // Scope to the header element — the site uses <header> not role="navigation"
    const header = page.locator('header').first();

    await expect(header.getByRole('link', { name: /openzosma/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /about/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /book a demo/i })).toBeVisible();
  });

  test('hero headline is present and readable', async ({ page }) => {
    // "Every Answer Your Business Needs. Already in Your Data."
    await expect(
      page.getByRole('heading', { name: /every answer your business needs/i }),
    ).toBeVisible();
  });

  test('"Start Free Trial" CTA is visible in the hero', async ({ page }) => {
    // The CTA may be a <a> or <button> — match either
    await expect(
      page
        .locator('a, button')
        .filter({ hasText: /start free trial/i })
        .first(),
    ).toBeVisible();
  });

  test('"How It Works" section has all three steps', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /how it works/i })).toBeVisible();
    // Use role heading to avoid strict-mode violations from duplicate text on the page
    await expect(page.getByRole('heading', { name: /connect your data/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /ask any question/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /get actionable insights/i })).toBeVisible();
  });

  test('FAQ section is visible and contains at least one question', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /frequently asked questions/i })).toBeVisible();

    // First FAQ item should be present
    await expect(page.getByText(/is my data secure/i)).toBeVisible();
  });

  test('footer contains social links and copyright notice', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.getByText(/© 2026 Zosma AI/i)).toBeVisible();
    // Social links
    await expect(footer.getByRole('link', { name: /linkedin/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /github/i })).toBeVisible();
  });

  test('nav logo links back to homepage', async ({ page }) => {
    const logo = page.locator('header').first().getByRole('link').first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('href', '/');
  });
});
