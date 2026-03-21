import { expect, test } from '@playwright/test';

// spec: specs/zosma-site.md
// seed: tests/seed.spec.ts

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
  });

  test('page title includes "About"', async ({ page }) => {
    await expect(page).toHaveTitle(/about/i);
  });

  test('main heading is visible', async ({ page }) => {
    // The site may use non-semantic heading elements; fall back to any visible text
    await expect(page.locator('h1, h2, h3').filter({ hasText: /about/i }).first()).toBeVisible();
  });

  test('"Our Story" section is present', async ({ page }) => {
    await expect(
      page
        .locator('h1, h2, h3')
        .filter({ hasText: /our story/i })
        .first(),
    ).toBeVisible();
    // Key story content
    await expect(page.getByText(/zosma ai started/i)).toBeVisible();
  });

  test('founder card — Arjun Nayak — is visible with LinkedIn link', async ({ page }) => {
    // Use heading role to avoid strict-mode violation (name appears in bio too)
    await expect(
      page
        .locator('h1, h2, h3, h4, h5, h6')
        .filter({ hasText: /arjun nayak/i })
        .first(),
    ).toBeVisible();
    await expect(page.getByText(/founder & ceo/i)).toBeVisible();

    const linkedInLink = page.getByRole('link', { name: /linkedin/i }).first();
    await expect(linkedInLink).toBeVisible();
  });

  test('advisor card — Yudhajit Nag — is visible', async ({ page }) => {
    await expect(page.getByText(/yudhajit nag/i).first()).toBeVisible();
    await expect(page.getByText(/technical & strategic advisor/i).first()).toBeVisible();
  });

  test('"Our Values" section lists all four values', async ({ page }) => {
    await expect(
      page
        .locator('h1, h2, h3')
        .filter({ hasText: /our values/i })
        .first(),
    ).toBeVisible();
    await expect(page.getByText(/customer first/i)).toBeVisible();
    await expect(page.getByText(/innovation/i).first()).toBeVisible();
    await expect(page.getByText(/transparency/i)).toBeVisible();
    await expect(page.getByText(/excellence/i).first()).toBeVisible();
  });

  test('navigation remains accessible from the About page', async ({ page }) => {
    const header = page.locator('header').first();
    await expect(header.getByRole('link', { name: /contact/i })).toBeVisible();
    await expect(header.getByRole('link', { name: /openzosma/i })).toBeVisible();
  });

  test('clicking nav "Contact" navigates to /contact', async ({ page }) => {
    await page
      .locator('header')
      .first()
      .getByRole('link', { name: /contact/i })
      .click();
    await expect(page).toHaveURL(/\/contact/);
  });
});
