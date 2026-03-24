import fs from 'node:fs';
import path from 'node:path';
import type { RunnerConfig } from '@zosmaai/zosma-qa-core';
import { loadConfig } from '@zosmaai/zosma-qa-core';
import { buildCapabilities, validateCapabilities } from './capabilities';
import { mergeWithDefaults } from './defaults';
import type { AppiumConfig, ResolvedAppiumConfig } from './types';

/**
 * Load and resolve Appium configuration.
 * 1. Load base zosma.config.ts
 * 2. Extract Appium-specific settings
 * 3. Apply smart defaults
 * 4. Auto-detect missing values
 * 5. Validate and return
 */
export async function loadAppiumConfig(
  _runnerConfig: RunnerConfig,
  cwd: string = process.cwd(),
): Promise<ResolvedAppiumConfig> {
  // Load base config
  const baseConfig = await loadConfig(cwd);

  // Extract Appium plugin config (if appium.config.ts exists)
  const appiumOverrides = await loadAppiumConfigFile(cwd);

  // Merge: baseConfig + appiumOverrides + smart defaults
  const merged = mergeWithDefaults(
    { ...baseConfig, ...appiumOverrides },
    (appiumOverrides.platformName || 'ReactNative') as any,
  );

  // Auto-detect missing values
  const resolved = await autoDetectConfig(merged, cwd);

  // Build capabilities
  const mergedCapabilities = buildCapabilities(resolved);

  // Validate
  validateCapabilities(mergedCapabilities, (resolved.platformName || 'ReactNative') as any);

  return {
    ...resolved,
    platformName: (resolved.platformName || 'ReactNative') as any,
    mergedCapabilities,
  } as ResolvedAppiumConfig;
}

/**
 * Load optional appium.config.ts file from project root.
 * This file allows Appium-specific config separate from zosma.config.ts.
 * For now, users can just use zosma.config.ts with appium properties.
 */
async function loadAppiumConfigFile(cwd: string): Promise<Partial<AppiumConfig>> {
  // Try appium.config.ts or appium.config.js
  const configFilePath = path.join(cwd, 'appium.config.ts');

  if (fs.existsSync(configFilePath)) {
    try {
      // For TypeScript, this would be handled by the build system
      // For now, we assume zosma.config.ts is the primary source
      console.debug(`Found appium.config.ts, but using zosma.config.ts as primary source`);
    } catch {
      console.warn(`Failed to load appium.config.ts`);
    }
  }

  // For now, return empty — all config comes from zosma.config.ts
  return {};
}

/**
 * Auto-detect missing config values by inspecting the project.
 * This implements the "zero-config" philosophy.
 */
async function autoDetectConfig(config: AppiumConfig, cwd: string): Promise<AppiumConfig> {
  const resolved: AppiumConfig = { ...config };

  // Auto-detect appPath
  if (!resolved.appPath) {
    resolved.appPath = await autoDetectAppPath(cwd, resolved.platformName || 'ReactNative');
  }

  // Auto-detect appId
  if (!resolved.appId) {
    resolved.appId = await autoDetectAppId(cwd, resolved.platformName || 'ReactNative');
  }

  // Auto-detect deviceName (done during device selection, not here)
  // Device manager handles this interactively

  // Auto-detect devServerUrl
  if (!resolved.devServerUrl) {
    resolved.devServerUrl = await autoDetectDevServer(cwd);
  }

  return resolved;
}

/**
 * Auto-detect the path to the built app.
 * Looks in common React Native build output directories.
 */
async function autoDetectAppPath(cwd: string, platform: string): Promise<string> {
  const candidates: string[] = [];

  switch (platform) {
    case 'iOS':
    case 'ReactNative': {
      // iOS common build outputs
      const iosBuilder = [
        'ios/build/Release-iphonesimulator', // Simulator build
        'ios/build/Release-iphoneos', // Device build
        'build/Release-iphonesimulator',
      ];
      candidates.push(...iosBuilder.map((dir) => path.join(cwd, dir)));
      break;
    }

    case 'Android': {
      // Android common build outputs
      const androidBuilds = [
        'android/app/build/outputs/apk/debug/app-debug.apk',
        'android/app/build/outputs/apk/release/app-release.apk',
        'android/app/build/outputs/bundle/release/app-release.aab',
      ];
      candidates.push(...androidBuilds.map((dir) => path.join(cwd, dir)));
      break;
    }

    case 'Flutter': {
      // Flutter common build outputs
      const flutterBuilds = [
        'build/app/outputs/flutter-apk/app-release.apk',
        'build/app/outputs/flutter-apk/app-debug.apk',
        'build/ios/iphoneos/Runner.app', // iOS build
      ];
      candidates.push(...flutterBuilds.map((dir) => path.join(cwd, dir)));
      break;
    }
  }

  // Check which candidates exist
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // No app found
  return '';
}

/**
 * Auto-detect the app ID from project files.
 * Looks in package.json, AndroidManifest.xml, Info.plist, etc.
 */
async function autoDetectAppId(cwd: string, platform: string): Promise<string> {
  // Try package.json first (may have 'appId' or custom field)
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
      if (pkg.appId && typeof pkg.appId === 'string') {
        return pkg.appId;
      }
      // Fallback: use 'name' field if it looks like a bundle ID
      if (pkg.name && typeof pkg.name === 'string' && pkg.name.includes('.')) {
        return pkg.name;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // For Android: parse AndroidManifest.xml
  if (platform === 'Android' || platform === 'ReactNative') {
    const androidManifestPath = path.join(cwd, 'android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(androidManifestPath)) {
      try {
        const manifest = fs.readFileSync(androidManifestPath, 'utf-8');
        // Extract package attribute: <manifest package="com.example.app">
        const match = manifest.match(/package="([^"]+)"/);
        if (match) {
          return match[1];
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  // For iOS: parse Info.plist
  if (platform === 'iOS' || platform === 'ReactNative') {
    const infoPlistPath = path.join(cwd, 'ios/Runner/Info.plist');
    // Basic plist parsing (simplified)
    if (fs.existsSync(infoPlistPath)) {
      try {
        const plist = fs.readFileSync(infoPlistPath, 'utf-8');
        // Look for CFBundleIdentifier
        const match = plist.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
        if (match) {
          return match[1];
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return '';
}

/**
 * Auto-detect React Native dev server URL.
 * Checks if a dev server is running on the default port (8081).
 */
async function autoDetectDevServer(_cwd: string): Promise<string> {
  const defaultHost = 'localhost';
  const defaultPort = 8081;
  const url = `http://${defaultHost}:${defaultPort}`;

  try {
    // Try to fetch from the dev server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    const response = await fetch(`${url}/status`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      return url;
    }
  } catch {
    // Dev server not running
  }

  return '';
}

/**
 * Describe the loaded configuration for logging/debugging.
 */
export function describeConfig(config: ResolvedAppiumConfig): string {
  const lines = [
    `Appium Configuration:`,
    `  Platform: ${config.platformName || 'ReactNative'}`,
    `  App Path: ${config.appPath || '(auto-detected)'}`,
    `  App ID: ${config.appId || '(auto-detected)'}`,
    `  Device: ${config.deviceName || '(auto-detected)'}`,
    `  Appium Server: ${config.appiumHost}:${config.appiumPort}`,
    `  Dev Server: ${config.devServerUrl || '(not detected)'}`,
    `  Test Directory: ${config.testDir}`,
    `  Timeout: ${config.timeout}ms`,
    `  Workers: ${config.workers}`,
    `  CI Mode: ${config.ci ? 'yes' : 'no'}`,
    `  Auto-launch Simulator: ${config.autoLaunchSimulator ? 'yes' : 'no'}`,
  ];

  return lines.join('\n');
}
