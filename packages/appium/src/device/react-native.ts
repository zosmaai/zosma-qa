import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { ReactNativeProjectMetadata } from '../config/types';

/**
 * React Native-specific helpers for auto-detection and setup.
 */

export async function detectReactNativeProject(
  cwd: string,
): Promise<ReactNativeProjectMetadata | null> {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;

    // Check if this looks like a React Native project
    const allDeps: Record<string, unknown> = {};
    if (typeof pkg.dependencies === 'object' && pkg.dependencies) {
      Object.assign(allDeps, pkg.dependencies);
    }
    if (typeof pkg.devDependencies === 'object' && pkg.devDependencies) {
      Object.assign(allDeps, pkg.devDependencies);
    }
    if (!allDeps['react-native'] && !allDeps.react) {
      return null;
    }

    const metadata: ReactNativeProjectMetadata = {
      packageJsonPath,
      usesTypeScript: fs.existsSync(path.join(cwd, 'tsconfig.json')),
      devServerRunning: false,
      devServerUrl: undefined,
    };

    // Try to auto-detect app ID
    metadata.appId = extractAppIdFromProject(cwd);

    // Check if dev server is running
    const devServerUrl = await detectDevServer(cwd);
    if (devServerUrl) {
      metadata.devServerRunning = true;
      metadata.devServerUrl = devServerUrl;
    }

    return metadata;
  } catch {
    return null;
  }
}

/**
 * Extract app ID from React Native project files.
 */
function extractAppIdFromProject(cwd: string): string | undefined {
  // Try Android first
  const androidManifestPath = path.join(cwd, 'android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(androidManifestPath)) {
    try {
      const manifest = fs.readFileSync(androidManifestPath, 'utf-8');
      const match = manifest.match(/package="([^"]+)"/);
      if (match) {
        return match[1];
      }
    } catch {
      // Ignore
    }
  }

  // Try iOS Info.plist
  const infoPlistPath = path.join(cwd, 'ios/Runner/Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    try {
      const plist = fs.readFileSync(infoPlistPath, 'utf-8');
      const match = plist.match(/<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/);
      if (match) {
        return match[1];
      }
    } catch {
      // Ignore
    }
  }

  return undefined;
}

/**
 * Detect if React Native dev server is running.
 * Checks localhost:8081 by default.
 */
async function detectDevServer(
  _cwd: string,
  port = 8081,
  host = 'localhost',
): Promise<string | null> {
  const url = `http://${host}:${port}`;

  return new Promise((resolve) => {
    const req = http.get(`${url}/status`, { timeout: 1000 }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        resolve(url);
      } else {
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * Get the display name of the React Native app from package.json.
 */
export function getAppDisplayName(cwd: string): string | undefined {
  const packageJsonPath = path.join(cwd, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
    return pkg.displayName as string | undefined;
  } catch {
    return undefined;
  }
}
