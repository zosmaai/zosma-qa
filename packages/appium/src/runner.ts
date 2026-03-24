import type { RunnerConfig, TestResult } from '@zosmaai/zosma-qa-core';
import { loadAppiumConfig } from './config/loader';
import type { ResolvedAppiumConfig } from './config/types';
import { DeviceManager } from './device/device-manager';
import { findAppiumTests } from './discovery';
import { AppiumServer } from './server/appium-server';

/**
 * AppiumRunner orchestrates Appium test execution.
 * Manages:
 * - Config loading & validation
 * - Appium server lifecycle
 * - Device detection & management
 * - Test discovery & execution
 * - Result aggregation
 */
export class AppiumRunner {
  private config: ResolvedAppiumConfig | null = null;
  private server: AppiumServer | null = null;
  private deviceManager: DeviceManager | null = null;

  constructor(private baseConfig: RunnerConfig) {}

  /**
   * Execute the test suite.
   * 1. Load & validate config
   * 2. Start Appium server
   * 3. Prepare device (launch simulator if needed)
   * 4. Discover tests
   * 5. Run tests
   * 6. Cleanup
   * 7. Return results
   */
  async execute(): Promise<TestResult[]> {
    try {
      // 1. Load config
      console.log(`Loading Appium configuration...`);
      this.config = await loadAppiumConfig(this.baseConfig);
      console.log(`Config loaded successfully`);

      // 2. Start server
      console.log(`Starting Appium server...`);
      this.server = new AppiumServer({
        host: this.config.appiumHost,
        port: this.config.appiumPort,
        logLevel: this.config.verbose ? 'debug' : 'warn',
      });
      await this.server.start();

      // 3. Initialize device manager
      this.deviceManager = new DeviceManager();

      // 4. Discover tests
      const testFiles = findAppiumTests(this.config.testDir);
      if (testFiles.length === 0) {
        console.warn(`No Appium tests found in ${this.config.testDir}`);
        return [];
      }
      console.log(`Found ${testFiles.length} test file(s)`);

      // 5. Run tests (placeholder)
      const results: TestResult[] = [];
      for (const testFile of testFiles) {
        console.log(`Running: ${testFile}`);
        // TODO: Actual test execution logic
        results.push({
          name: testFile,
          status: 'skipped',
          duration: 0,
        });
      }

      return results;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Cleanup resources.
   */
  private async cleanup(): Promise<void> {
    if (this.deviceManager) {
      await this.deviceManager.cleanup();
    }
    if (this.server) {
      await this.server.stop();
    }
  }
}
