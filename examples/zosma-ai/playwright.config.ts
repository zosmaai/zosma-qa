import { defineConfig } from '@zosma-qa/playwright';

/**
 * Playwright config for the zosma.ai example test suite.
 *
 * This shows how a team would configure zosma-qa for a real production site.
 * Tests cover all public pages and the contact form (network-mocked submit).
 */
export default defineConfig({
  use: {
    baseURL: 'https://www.zosma.ai',
    /** Capture a full-page screenshot on every failure for easy debugging. */
    screenshot: 'only-on-failure',
  },
  browsers: ['chromium'],
});
