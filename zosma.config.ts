import { defineConfig } from '@zosmaai/zosma-qa-core';

/**
 * zosma-qa root configuration.
 *
 * Controls global settings shared across all test runner plugins.
 * Runner-specific options (browser projects, retries, etc.) live in
 * playwright.config.ts (or the equivalent config for other runners).
 *
 * Future plugins: 'k6', 'artillery', 'rest'
 */
export default defineConfig({
  plugins: ['playwright'],
  testDir: './tests',
  baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  browsers: ['chromium'],
});
