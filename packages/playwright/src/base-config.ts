import { defineConfig as pwDefineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';
import type { Browser } from '@zosmaai/zosma-qa-core';

/**
 * Extended configuration type that adds zosma-qa's `browsers` shorthand
 * on top of the standard Playwright config.
 */
export interface ZosmaPlaywrightConfig extends Omit<PlaywrightTestConfig, 'projects'> {
  /**
   * Browsers to create test projects for.
   * Each entry maps to a Playwright device preset.
   *
   * @default ['chromium']
   * @example ['chromium', 'firefox', 'webkit']
   */
  browsers?: Browser[];
}

const BROWSER_DEVICES: Record<Browser, (typeof devices)[string]> = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

/**
 * Define a Playwright config that extends zosma-qa's best-practice defaults.
 *
 * Defaults applied automatically:
 *  - fullyParallel: true
 *  - retries: 2 on CI, 0 locally
 *  - workers: 1 on CI, auto locally
 *  - reporters: html + list (+ github on CI)
 *  - trace: on-first-retry
 *  - screenshot: only-on-failure
 *  - video: retain-on-failure
 *
 * @example
 * // playwright.config.ts
 * import { defineConfig } from '@zosmaai/zosma-qa-playwright';
 * export default defineConfig({
 *   use: { baseURL: 'https://www.myapp.com' },
 *   browsers: ['chromium', 'firefox'],
 * });
 */
export function defineConfig(overrides: ZosmaPlaywrightConfig = {}): PlaywrightTestConfig {
  const isCI = !!process.env.CI;
  const { browsers = ['chromium'], use: useOverrides, ...rest } = overrides;

  const projects = browsers.map((browser) => ({
    name: browser,
    use: { ...BROWSER_DEVICES[browser] },
  }));

  return pwDefineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: isCI
      ? [['html'], ['github'], ['list']]
      : [['html'], ['list']],
    use: {
      trace: 'on-first-retry',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      ...useOverrides,
    },
    projects,
    ...rest,
  });
}
