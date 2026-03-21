import { defineConfig } from '@zosma-qa/core';

/**
 * zosma-qa configuration.
 *
 * Controls which test runner plugins are active and shared settings
 * that apply across all runners.
 *
 * Runner-specific settings (e.g. Playwright projects) go in
 * playwright.config.ts.
 */
export default defineConfig({
  /** Active test runner plugins. Future options: 'k6', 'artillery', 'rest' */
  plugins: ['playwright'],

  /** Root directory where your tests live. */
  testDir: './tests',

  /** Base URL of the app under test. */
  baseURL: 'http://localhost:3000',

  /** Default browsers. Can also be set per-run with --project CLI flag. */
  browsers: ['chromium'],
});
