import { defineConfig } from '@zosmaai/zosma-qa-playwright';

/**
 * Root Playwright configuration for zosma-qa.
 *
 * This config is the default when running `pnpm test` or `npx zosma-qa run`
 * from the repo root. Users who clone this repo should update `baseURL`
 * to point at their app under test.
 *
 * Run `npx zosma-qa init` to have the CLI configure this file interactively.
 */
export default defineConfig({
  use: {
    /**
     * Base URL of the app under test.
     * All page.goto('/path') calls resolve relative to this.
     *
     * Override at runtime:
     *   BASE_URL=https://staging.myapp.com npx zosma-qa run
     */
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },

  /**
   * Browsers to run tests against.
   * Default: Chromium only (fast for local development).
   * Expand to ['chromium', 'firefox', 'webkit'] for full cross-browser coverage.
   */
  browsers: ['chromium'],

  // Uncomment to spin up your dev server before tests run:
  // webServer: {
  //   command: 'npm run dev',
  //   url: process.env.BASE_URL ?? 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
