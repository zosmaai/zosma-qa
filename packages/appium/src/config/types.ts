import type { ZosmaConfig } from '@zosmaai/zosma-qa-core';

/**
 * Supported platforms for Appium testing.
 * Phase 1: Focus on React Native
 * Future: iOS, Android, Flutter, React Native Web, etc.
 */
export type AppiumPlatform = 'ReactNative' | 'iOS' | 'Android' | 'Flutter' | 'ReactNativeWeb';

/**
 * Appium configuration (extends core ZosmaConfig).
 * Users define this in zosma.config.ts under appium-specific options.
 */
export interface AppiumConfig extends Omit<ZosmaConfig, 'testDir'> {
  /** Target platform. Default: 'ReactNative' */
  platformName?: AppiumPlatform;

  /** Path to built app (APK, IPA, or app bundle) */
  appPath?: string;

  /** App ID / bundle identifier (e.g., 'com.example.app') */
  appId?: string;

  /** Device name or ID (e.g., 'iPhone 15 Pro Simulator') */
  deviceName?: string;

  /** Automation engine (e.g., 'XCUITest', 'UIAutomator2'). Auto-detected if not provided. */
  automationName?: string;

  /** Appium server host. Default: 'localhost' */
  appiumHost?: string;

  /** Appium server port. Default: 4723 (auto-allocated if in use) */
  appiumPort?: number;

  /** Whether to auto-launch simulator/emulator if not running. Default: true */
  autoLaunchSimulator?: boolean;

  /** React Native dev server URL (for live reload). Default: auto-detected from localhost:8081 */
  devServerUrl?: string;

  /** Number of parallel workers. Default: 1 (mobile testing is typically serial) */
  workers?: number;

  /** Test timeout in milliseconds. Default: 30000 */
  timeout?: number;

  /** Custom WebDriver capabilities. Merges with auto-detected capabilities. */
  capabilities?: Record<string, unknown>;

  /** Directory containing test files. Default: './tests' */
  testDir?: string;

  /** Whether running in CI mode. Default: false */
  ci?: boolean;

  /** Enable Appium server logging. Default: false */
  verbose?: boolean;

  /** Screenshot directory for failed tests. Default: './test-results/screenshots' */
  screenshotDir?: string;

  /** Whether to record videos of test runs. Default: false */
  recordVideo?: boolean;

  /** Video directory if recordVideo is true. Default: './test-results/videos' */
  videoDir?: string;
}

/**
 * Normalized, validated Appium configuration with all defaults applied.
 * This is what AppiumRunner actually uses internally.
 */
export interface ResolvedAppiumConfig extends Required<AppiumConfig> {
  /** Merged and validated capabilities object */
  mergedCapabilities: Record<string, unknown>;
}

/**
 * Device information detected by DeviceManager.
 */
export interface Device {
  /** Device ID (UDID for iOS, serial for Android) */
  id: string;

  /** Human-readable device name */
  name: string;

  /** Platform: ios, android, or rn (React Native on iOS/Android) */
  platform: 'ios' | 'android' | 'rn';

  /** Whether this is a simulator/emulator (not a physical device) */
  isSimulator: boolean;

  /** OS version */
  osVersion: string;

  /** Whether the device is currently available/ready */
  available: boolean;
}

/**
 * Appium server configuration passed to AppiumServer.
 */
export interface AppiumServerConfig {
  host: string;
  port: number;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  basePath?: string; // e.g., '/wd/hub'
  remoteUrl?: string; // for connecting to existing server
}

/**
 * Result of Appium test execution.
 */
export interface AppiumTestResult {
  file: string;
  tests: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
    screenshot?: string; // path to screenshot on failure
    logs?: string; // device logs
  }>;
  totalDuration: number;
  passed: number;
  failed: number;
  skipped: number;
}

/**
 * Device selection prompt result.
 */
export interface DeviceSelection {
  device: Device;
  userSelected: boolean; // true if user chose, false if auto-selected
}

/**
 * Auto-detected metadata about the React Native project.
 */
export interface ReactNativeProjectMetadata {
  /** Path to package.json */
  packageJsonPath: string;

  /** App ID from package.json or AndroidManifest.xml / Info.plist */
  appId?: string;

  /** Display name of the app */
  displayName?: string;

  /** Path to built app (if auto-detected) */
  builtAppPath?: string;

  /** Whether dev server is running (localhost:8081 by default) */
  devServerRunning: boolean;

  /** Dev server URL if running */
  devServerUrl?: string;

  /** Whether project uses TypeScript or JavaScript */
  usesTypeScript: boolean;
}
