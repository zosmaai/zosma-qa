import { expect, test } from '@playwright/test';

// spec: specs/zosma-site.md
// seed: tests/seed.spec.ts

test.describe('OpenZosma page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/openzosma');
    await page.waitForLoadState('networkidle');
  });

  test('page title identifies the OpenZosma product', async ({ page }) => {
    await expect(page).toHaveTitle(/openzosma/i);
  });

  test('hero headline is visible', async ({ page }) => {
    // The h1 reads: "Your Team's AI Twins. Always On."
    // Use a text locator to avoid strict-mode issues with sr-only nav headings.
    await expect(
      page
        .locator('h1')
        .filter({ hasText: /your team/i })
        .first(),
    ).toBeVisible();
  });

  test('"Open Source · Apache 2.0" badge is shown', async ({ page }) => {
    await expect(page.getByText(/apache 2\.0/i).first()).toBeVisible();
  });

  test('"Star on GitHub" links resolve to the correct GitHub repo', async ({ page }) => {
    const githubLinks = page.getByRole('link', { name: /star on github/i });
    const first = githubLinks.first();
    await expect(first).toBeVisible();
    await expect(first).toHaveAttribute('href', /github\.com\/zosmaai\/openzosma/i);
  });

  test('"Your AI Team" section is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /your ai team/i }).first()).toBeVisible();
  });

  test('"Up and Running in Three Steps" section shows all three steps', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /up and running in three steps/i }).first(),
    ).toBeVisible();
    await expect(page.getByText(/create your twins/i).first()).toBeVisible();
    await expect(page.getByText(/build your hierarchy/i).first()).toBeVisible();
    await expect(page.getByText(/work from anywhere/i).first()).toBeVisible();
  });

  test('tech stack section lists core technologies', async ({ page }) => {
    await expect(page.getByText(/TypeScript/).first()).toBeVisible();
    await expect(page.getByText(/Next\.js/).first()).toBeVisible();
    await expect(page.getByText(/PostgreSQL/).first()).toBeVisible();
  });

  test('"Fully Open Source. Self-Hosted." section is present', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /fully open source/i }).first()).toBeVisible();
    await expect(page.getByText(/no vendor lock-in/i).first()).toBeVisible();
    await expect(page.getByText(/apache 2\.0 license/i).first()).toBeVisible();
  });

  test('terminal snippet shows the quick-start commands', async ({ page }) => {
    await expect(page.getByText(/git clone.*openzosma/i).first()).toBeVisible();
    await expect(page.getByText(/pnpm install/i).first()).toBeVisible();
  });
});
