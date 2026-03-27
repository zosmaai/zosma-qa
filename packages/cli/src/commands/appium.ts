import fs from 'node:fs';
import path from 'node:path';
import { AppiumRunner } from '@zosmaai/zosma-qa-appium';
import { loadConfig } from '@zosmaai/zosma-qa-core';
import chalk from 'chalk';

export interface AppiumRunOptions {
  platform?: string;
  device?: string;
  app?: string;
  port?: string;
  verbose?: boolean;
  grep?: string;
}

/**
 * `zosma-qa appium run` — execute Appium mobile tests.
 */
export async function runAppium(options: AppiumRunOptions = {}): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa') + chalk.dim('  running Appium mobile tests'));
  console.log('');

  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  const runner = new AppiumRunner({
    testDir: config.testDir,
    baseURL: config.baseURL,
    browsers: [],
    reporters: [],
    ci: false,
    extraArgs: buildExtraArgs(options),
  });

  const results = await runner.execute();

  // Print summary
  console.log('');
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  if (failed > 0) {
    console.log(
      chalk.bold.red(`  ${failed} failed`) + chalk.dim(`, ${passed} passed, ${skipped} skipped`),
    );
    for (const r of results.filter((r) => r.status === 'failed')) {
      console.log(chalk.red(`    ✗ ${r.name}`) + (r.error ? chalk.dim(` — ${r.error}`) : ''));
    }
  } else if (skipped > 0 && passed === 0) {
    console.log(chalk.yellow(`  ${skipped} skipped`));
    for (const r of results.filter((r) => r.status === 'skipped')) {
      console.log(chalk.dim(`    - ${r.name}`) + (r.error ? chalk.dim(` — ${r.error}`) : ''));
    }
  } else {
    console.log(chalk.bold.green(`  ${passed} passed`));
  }
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

function buildExtraArgs(options: AppiumRunOptions): string[] {
  const args: string[] = [];
  if (options.platform) args.push('--platform', options.platform);
  if (options.device) args.push('--device', options.device);
  if (options.app) args.push('--app', options.app);
  if (options.port) args.push('--port', options.port);
  if (options.verbose) args.push('--verbose');
  if (options.grep) args.push('--grep', options.grep);
  return args;
}

/**
 * `zosma-qa appium init` — scaffold Appium test structure.
 */
export async function initAppium(): Promise<void> {
  const cwd = process.cwd();

  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa appium init') + chalk.dim(' — scaffold Appium mobile tests'),
  );
  console.log('');

  // Create tests/ directory
  const testsDir = path.join(cwd, 'tests');
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }

  // Create example test file
  const examplePath = path.join(testsDir, 'login.appium.ts');
  if (!fs.existsSync(examplePath)) {
    fs.writeFileSync(examplePath, EXAMPLE_TEST, 'utf8');
    console.log(chalk.green(`  Created  tests/login.appium.ts`));
  } else {
    console.log(chalk.dim(`  Skipped  tests/login.appium.ts  (already exists)`));
  }

  // Create appium.config.ts
  const configPath = path.join(cwd, 'appium.config.ts');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, APPIUM_CONFIG_TEMPLATE, 'utf8');
    console.log(chalk.green(`  Created  appium.config.ts`));
  } else {
    console.log(chalk.dim(`  Skipped  appium.config.ts  (already exists)`));
  }

  // Create test-results/ directory
  const resultsDir = path.join(cwd, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, '.gitkeep'), '', 'utf8');
  }

  console.log('');
  console.log(`${chalk.bold.green('  Ready!')}  Next steps:\n`);
  console.log(chalk.dim('  1. Install Appium (if not installed):'));
  console.log(chalk.cyan('     npm install -g appium'));
  console.log('');
  console.log(chalk.dim('  2. Install platform drivers:'));
  console.log(chalk.cyan('     appium driver install xcuitest     # iOS'));
  console.log(chalk.cyan('     appium driver install uiautomator2 # Android'));
  console.log('');
  console.log(chalk.dim('  3. Edit appium.config.ts with your app path and platform'));
  console.log('');
  console.log(chalk.dim('  4. Run your mobile tests:'));
  console.log(chalk.cyan('     npx zosma-qa appium run'));
  console.log('');
}

const EXAMPLE_TEST = `import {
  test,
  tapButton,
  fillInput,
  expectText,
  expectVisible,
  wait,
} from '@zosmaai/zosma-qa-appium';

test.describe('Login Flow', () => {
  test('should log in with valid credentials', async ({ driver }) => {
    // Wait for the app to load
    await expectVisible(driver, { testID: 'login-screen' }, { timeout: 10000 });

    // Fill in credentials
    await fillInput(driver, 'user@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });

    // Tap the login button
    await tapButton(driver, { testID: 'login-button' });

    // Verify we reach the home screen
    await expectText(driver, 'Welcome', { timeout: 5000, visible: true });
  });

  test('should show error for invalid credentials', async ({ driver }) => {
    await fillInput(driver, 'invalid@example.com', { testID: 'email-input' });
    await fillInput(driver, 'wrong', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });

    await wait(1000);
    await expectText(driver, 'Invalid credentials');
  });
});
`;

const APPIUM_CONFIG_TEMPLATE = `import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  testDir: './tests',

  // ─── Platform configuration ──────────────────────────────────
  // platformName: 'iOS',         // 'iOS' | 'Android' | 'ReactNative'
  // appPath: './path/to/your.app',
  // appId: 'com.example.myapp',

  // ─── Device configuration ────────────────────────────────────
  // deviceName: 'iPhone 15 Pro',
  // platformVersion: '17.0',

  // ─── Appium server ───────────────────────────────────────────
  // appiumPort: 4723,
  // appiumHost: 'localhost',

  // ─── Timeouts ────────────────────────────────────────────────
  // launchTimeout: 60000,
  // commandTimeout: 30000,
});
`;
