import { defineConfig } from '@zosmaai/zosma-qa-playwright';

/**
 * Playwright configuration — extends zosma-qa's best-practice defaults.
 *
 * Defaults already applied for you:
 *   - fullyParallel: true
 *   - retries: 2 on CI, 0 locally
 *   - workers: 1 on CI, auto locally
 *   - reporters: html + list (+ github reporter on CI)
 *   - trace / screenshot / video: retained on failure
 *
 * See all options:
 *   https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  use: {
    /** Base URL — all page.goto('/path') calls resolve relative to this. */
    baseURL: 'http://localhost:3000',
  },

  /**
   * Browsers to run tests against.
   * Remove entries to speed up local runs; CI should run all three.
   */
  browsers: ['chromium'],

  // Uncomment to start your dev server before running tests:
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
