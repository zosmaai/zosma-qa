import type { AppiumConfig, AppiumPlatform } from './types';

/**
 * Smart defaults for Appium configuration.
 * These apply sensible values when users don't explicitly configure them.
 */

export const APPIUM_DEFAULTS: Record<string, unknown> = {
  // Core config (from ZosmaConfig)
  plugins: ['appium'],
  reporters: ['html', 'list'],
  testDir: './tests',
  baseURL: '',

  // Appium-specific defaults
  platformName: 'ReactNative',
  appPath: '',
  appId: '',
  deviceName: '',
  automationName: '',
  appiumHost: 'localhost',
  appiumPort: 4723,
  autoLaunchSimulator: true,
  devServerUrl: '',
  workers: 1,
  timeout: 30000,
  capabilities: {},
  ci: false,
  verbose: false,
  screenshotDir: './test-results/screenshots',
  recordVideo: false,
  videoDir: './test-results/videos',
};

/**
 * Platform-specific defaults.
 * These override APPIUM_DEFAULTS based on the detected or selected platform.
 */
export const PLATFORM_DEFAULTS: Record<AppiumPlatform, Partial<AppiumConfig>> = {
  ReactNative: {
    automationName: 'XCUITest', // Default to iOS; can be overridden to UIAutomator2
    platformName: 'ReactNative',
  },
  iOS: {
    automationName: 'XCUITest',
    platformName: 'iOS',
  },
  Android: {
    automationName: 'UIAutomator2',
    platformName: 'Android',
  },
  Flutter: {
    automationName: 'Flutter',
    platformName: 'Flutter',
  },
  ReactNativeWeb: {
    automationName: 'Chromium', // React Native Web runs in browser
    platformName: 'ReactNativeWeb',
  },
};

/**
 * Common Appium capabilities for WebDriver sessions.
 * These are merged with user-provided capabilities.
 */
export const COMMON_CAPABILITIES = {
  // For React Native (both iOS & Android)
  'appium:automationName': 'XCUITest', // will be overridden per platform
  'appium:noReset': false, // Reset app state between tests
  'appium:newCommandTimeout': 60,
} as const;

/**
 * iOS-specific capability defaults.
 */
export const IOS_CAPABILITIES = {
  'appium:platformName': 'iOS',
  'appium:platformVersion': '', // Will be auto-detected
  'appium:deviceName': '', // Will be auto-detected
  'appium:automationName': 'XCUITest',
  'appium:app': '', // Will be set from appPath
} as const;

/**
 * Android-specific capability defaults.
 */
export const ANDROID_CAPABILITIES = {
  'appium:platformName': 'Android',
  'appium:platformVersion': '', // Will be auto-detected
  'appium:deviceName': '', // Will be auto-detected
  'appium:automationName': 'UIAutomator2',
  'appium:app': '', // Will be set from appPath
  'appium:appPackage': '', // Will be extracted from appId
  'appium:appActivity': '', // Can be auto-detected
} as const;

/**
 * React Native-specific defaults.
 * These help with common RN setups.
 */
export const REACT_NATIVE_DEFAULTS = {
  // Typical RN dev server port
  devServerPort: 8081,
  devServerHost: 'localhost',

  // Common RN app ID patterns
  iosAppIdPattern: /com\.example\..+/,
  androidAppIdPattern: /com\.example\..+/,

  // Build output directories
  iosAppDirectory: './ios/build/Release-iphonesimulator',
  androidAppDirectory: './android/app/build/outputs/apk/debug',
};

/**
 * Merge user config with defaults, respecting user overrides.
 * @param userConfig - User-provided config from zosma.config.ts
 * @param platform - Target platform (to apply platform-specific defaults)
 * @returns Merged config with all defaults applied
 */
export function mergeWithDefaults(
  userConfig: Partial<AppiumConfig>,
  platform: AppiumPlatform = 'ReactNative',
): AppiumConfig {
  // Start with base defaults
  let merged: AppiumConfig = APPIUM_DEFAULTS as unknown as AppiumConfig;

  // Apply platform-specific defaults
  merged = {
    ...merged,
    ...(PLATFORM_DEFAULTS[platform] as any),
  };

  // Override with user config
  merged = {
    ...merged,
    ...userConfig,
  };

  return merged;
}

/**
 * Get auto-detection defaults for a specific platform.
 * These are used when properties are not explicitly configured.
 */
export function getPlatformDefaults(platform: AppiumPlatform): Partial<AppiumConfig> {
  return PLATFORM_DEFAULTS[platform] || PLATFORM_DEFAULTS.ReactNative;
}
