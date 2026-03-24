import { ANDROID_CAPABILITIES, COMMON_CAPABILITIES, IOS_CAPABILITIES } from './defaults';
import type { AppiumConfig, AppiumPlatform } from './types';

/**
 * Build WebDriver capabilities object from Appium config.
 * Handles platform-specific capability mapping and merges with user overrides.
 */
export function buildCapabilities(config: AppiumConfig): Record<string, unknown> {
  // Start with common capabilities
  let capabilities: Record<string, unknown> = { ...COMMON_CAPABILITIES };

  // Add platform-specific capabilities
  const platform = config.platformName || 'ReactNative';
  switch (platform) {
    case 'iOS':
    case 'ReactNative': // React Native on iOS
      capabilities = {
        ...capabilities,
        ...buildIOSCapabilities(config),
      };
      break;

    case 'Android':
      capabilities = {
        ...capabilities,
        ...buildAndroidCapabilities(config),
      };
      break;

    case 'Flutter':
      capabilities = {
        ...capabilities,
        ...buildFlutterCapabilities(config),
      };
      break;

    case 'ReactNativeWeb':
      capabilities = {
        ...capabilities,
        ...buildReactNativeWebCapabilities(config),
      };
      break;
  }

  // Merge user-provided capabilities (highest priority)
  if (config.capabilities && typeof config.capabilities === 'object') {
    capabilities = {
      ...capabilities,
      ...config.capabilities,
    };
  }

  return capabilities;
}

/**
 * Build iOS-specific capabilities.
 */
function buildIOSCapabilities(config: AppiumConfig): Record<string, unknown> {
  const caps: Record<string, unknown> = {
    ...IOS_CAPABILITIES,
  };

  // Map config values to capabilities
  if (config.automationName) {
    caps['appium:automationName'] = config.automationName;
  } else {
    caps['appium:automationName'] = 'XCUITest';
  }

  if (config.deviceName) {
    caps['appium:deviceName'] = config.deviceName;
  }

  if (config.appPath) {
    caps['appium:app'] = config.appPath;
  }

  // Add development team if available (optional)
  // caps['appium:xcodeSigningId'] = 'iPhone Developer'; // or config.signingId

  return caps;
}

/**
 * Build Android-specific capabilities.
 */
function buildAndroidCapabilities(config: AppiumConfig): Record<string, unknown> {
  const caps: Record<string, unknown> = {
    ...ANDROID_CAPABILITIES,
  };

  // Map config values to capabilities
  if (config.automationName) {
    caps['appium:automationName'] = config.automationName;
  } else {
    caps['appium:automationName'] = 'UIAutomator2';
  }

  if (config.deviceName) {
    caps['appium:deviceName'] = config.deviceName;
  }

  if (config.appPath) {
    caps['appium:app'] = config.appPath;
  }

  if (config.appId) {
    caps['appium:appPackage'] = extractPackageFromAppId(config.appId);
  }

  return caps;
}

/**
 * Build Flutter-specific capabilities.
 */
function buildFlutterCapabilities(config: AppiumConfig): Record<string, unknown> {
  const caps: Record<string, unknown> = {
    'appium:platformName': 'Android', // Flutter typically runs on Android/iOS
    'appium:automationName': 'Flutter',
  };

  if (config.deviceName) {
    caps['appium:deviceName'] = config.deviceName;
  }

  if (config.appPath) {
    caps['appium:app'] = config.appPath;
  }

  return caps;
}

/**
 * Build React Native Web capabilities.
 * React Native Web runs in a browser (Chromium, Safari, etc.).
 */
function buildReactNativeWebCapabilities(_config: AppiumConfig): Record<string, unknown> {
  return {
    'appium:platformName': 'Web',
    'appium:automationName': 'Chromium',
    // baseUrl is handled by the test runner, not Appium
  };
}

/**
 * Extract package name from app ID.
 * e.g., 'com.example.myapp' -> 'com.example.myapp'
 * (Already in correct format for appPackage)
 */
function extractPackageFromAppId(appId: string): string {
  // Validate that it looks like a valid package name
  if (!/^[a-zA-Z0-9._]+$/.test(appId)) {
    console.warn(`Warning: appId "${appId}" may not be a valid package name`);
  }
  return appId;
}

/**
 * Validate required capabilities are present.
 * Throws an error if critical values are missing or invalid.
 */
export function validateCapabilities(
  capabilities: Record<string, unknown>,
  platform: AppiumPlatform,
): void {
  const platformName = capabilities['appium:platformName'];

  if (!platformName) {
    throw new Error('Capability appium:platformName is required');
  }

  // Platform-specific validation
  switch (platform) {
    case 'iOS':
    case 'ReactNative': {
      // iOS requires either app or using Safari (default)
      const app = capabilities['appium:app'];
      if (!app) {
        // This is OK — can test in Safari without an app
      }
      break;
    }

    case 'Android': {
      // Android typically requires appPackage for app testing
      const appPackage = capabilities['appium:appPackage'];
      const app = capabilities['appium:app'];
      if (!appPackage && !app) {
        // Can test in web browser (Chrome) without specifying a package
      }
      break;
    }

    case 'Flutter': {
      const app = capabilities['appium:app'];
      if (!app) {
        throw new Error('Flutter testing requires appium:app (path to Flutter app) to be set');
      }
      break;
    }

    case 'ReactNativeWeb': {
      // React Native Web just needs a baseURL, handled elsewhere
      break;
    }
  }
}

/**
 * Get a human-readable description of the capabilities.
 * Useful for logging and debugging.
 */
export function describeCapabilities(capabilities: Record<string, unknown>): string {
  const platform = capabilities['appium:platformName'] ?? 'Unknown';
  const automationName = capabilities['appium:automationName'] ?? 'Unknown';
  const deviceName = capabilities['appium:deviceName'] ?? 'auto-detected';
  const app = capabilities['appium:app'] ?? 'default';

  return (
    `Appium capabilities: platform=${platform}, ` +
    `automation=${automationName}, device=${deviceName}, app=${app}`
  );
}
