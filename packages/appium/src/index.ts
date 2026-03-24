import type { RunnerConfig, TestResult, ZosmaPlugin } from '@zosmaai/zosma-qa-core';
import { AppiumRunner } from './runner';

/**
 * AppiumPlugin — Appium test runner for zosma-qa.
 * Implements the ZosmaPlugin interface.
 *
 * Usage in zosma.config.ts:
 * ```typescript
 * export default defineConfig({
 *   plugins: ['appium'],
 *   platformName: 'ReactNative',
 *   appiumPort: 4723,
 *   testDir: './tests',
 * });
 * ```
 */
export class AppiumPlugin implements ZosmaPlugin {
  readonly name = 'appium';

  /**
   * Execute Appium tests.
   */
  async run(config: RunnerConfig): Promise<TestResult[]> {
    const runner = new AppiumRunner(config);
    return runner.execute();
  }

  /**
   * Optional: Generate/open a report (future phase).
   */
  async report?(results: TestResult[]): Promise<void> {
    console.log(`Appium test report: ${results.length} tests`);
  }
}

// Export plugin instance
export const appiumPlugin = new AppiumPlugin();

export { buildCapabilities, validateCapabilities } from './config/capabilities';
export { describeConfig, loadAppiumConfig } from './config/loader';
export type { AppiumConfig, Device, ResolvedAppiumConfig } from './config/types';
export { DeviceManager } from './device/device-manager';
export { findAppiumTests } from './discovery';
// Export core classes & types for advanced users
export { AppiumRunner } from './runner';
export { AppiumServer } from './server/appium-server';

// Export test builder & helpers
export { expect, test } from './test-builder';
export * from './utils/test-helpers';
