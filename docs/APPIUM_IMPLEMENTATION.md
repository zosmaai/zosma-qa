# Appium Runner Implementation Plan

## Overview

This document outlines the implementation strategy for adding Appium mobile testing support to zosma-qa, focusing initially on **React Native** with a foundation that scales to iOS, Android, Flutter, and other platforms.

**Project goal:** Enable QA engineers to quickly write React Native tests using Agentic IDE, then run them locally with zero configuration complexity.

---

## Design Principles

1. **Zero-Config**: Auto-detect app paths, simulators, and sensible defaults
2. **Agent-Friendly**: Provide both high-level helpers AND raw WebDriver access
3. **Familiar Syntax**: Tests feel like Playwright tests (same `test()` function pattern)
4. **Robust Reporting**: Unified reports with mobile-specific context (screenshots, device logs)
5. **Extensible**: Foundation supports React Native now, scales to iOS/Android/Flutter later

---

## Architecture Overview

```
packages/appium/
├── src/
│   ├── index.ts              ← Main plugin export (ZosmaPlugin implementation)
│   ├── runner.ts             ← AppiumRunner class
│   ├── server/
│   │   └── appium-server.ts  ← Appium server lifecycle management
│   ├── device/
│   │   ├── device-manager.ts ← Unified device interface
│   │   ├── simulator.ts      ← iOS Simulator helpers
│   │   ├── emulator.ts       ← Android Emulator helpers
│   │   └── react-native.ts   ← React Native-specific helpers
│   ├── config/
│   │   ├── types.ts          ← Config schema & interfaces
│   │   ├── defaults.ts       ← Smart defaults for React Native
│   │   ├── loader.ts         ← Load & validate config
│   │   └── capabilities.ts   ← Build Appium capabilities
│   ├── discovery.ts          ← Test file discovery (.appium.ts, .appium.py)
│   ├── utils/
│   │   ├── test-helpers.ts   ← Agent-friendly wrappers (tapButton, fillInput, etc.)
│   │   ├── locators.ts       ← Locator strategies (testID, label, etc.)
│   │   ├── logger.ts         ← Logging & debugging utilities
│   │   └── report.ts         ← Report generation & aggregation
│   ├── test-builder.ts       ← Test({ driver }) fixture registration
│   └── types.ts              ← Exported types for users
├── templates/
│   ├── typescript/           ← Scaffold for TS projects
│   └── python/               ← Scaffold for Python projects
└── package.json              ← Already configured
```

---

## Phase 1: Foundation (Sprint 1-2)

### Goals
- Standalone Appium runner that executes React Native tests
- Appium server auto-management
- Smart device detection & launching
- Configuration system with sensible defaults
- Test discovery for `.appium.ts` and `.appium.py` files
- Build artifact that passes typecheck

### 1.1 Core Plugin Implementation

**File:** `packages/appium/src/index.ts`

**Responsibilities:**
- Implement `ZosmaPlugin` interface from `@zosmaai/zosma-qa-core`
- Implement async `run(config: RunnerConfig): Promise<TestResult[]>`
- Delegate to `AppiumRunner`
- Export types & test builder

**Key decisions:**
- Use `webdriverio` as WebDriver client (more feature-rich than raw appium client)
- Support both TypeScript and Python test execution via CLI dispatch

**Pseudo-code:**
```typescript
export class AppiumPlugin implements ZosmaPlugin {
  readonly name = 'appium';
  
  async run(config: RunnerConfig): Promise<TestResult[]> {
    const runner = new AppiumRunner(config);
    return await runner.execute();
  }
}

export { AppiumRunner } from './runner';
export * from './types';
export * from './test-builder';
```

### 1.2 AppiumRunner Class

**File:** `packages/appium/src/runner.ts`

**Responsibilities:**
- Orchestrate test execution lifecycle
- Load & validate Appium config
- Start/stop Appium server
- Launch/manage simulators
- Discover test files
- Execute tests via WebdriverIO or pytest-appium
- Collect results and aggregate

**Pseudo-code:**
```typescript
export class AppiumRunner {
  private server: AppiumServer;
  private deviceManager: DeviceManager;
  private config: AppiumConfig;

  async execute(): Promise<TestResult[]> {
    // 1. Load config with smart defaults
    this.config = await loadAppiumConfig(this.baseConfig);
    
    // 2. Start Appium server
    this.server = new AppiumServer(this.config.appiumPort);
    await this.server.start();
    
    // 3. Prepare device (launch simulator if needed)
    await this.deviceManager.prepare(this.config.device);
    
    // 4. Discover test files
    const testFiles = await findAppiumTests(this.config.testDir);
    
    // 5. Execute tests based on file type
    const results: TestResult[] = [];
    for (const file of testFiles) {
      if (file.endsWith('.ts')) {
        const result = await this.executeTypeScript(file);
        results.push(...result);
      } else if (file.endsWith('.py')) {
        const result = await this.executePython(file);
        results.push(...result);
      }
    }
    
    // 6. Cleanup
    await this.deviceManager.cleanup();
    await this.server.stop();
    
    return results;
  }

  private async executeTypeScript(file: string): Promise<TestResult[]> {
    // Run tests via Node.js + WebdriverIO
    // Similar to Playwright's test runner
  }

  private async executePython(file: string): Promise<TestResult[]> {
    // Run tests via pytest-appium
    // Similar to how CLI dispatches to pytest
  }
}
```

### 1.3 Appium Server Management

**File:** `packages/appium/src/server/appium-server.ts`

**Responsibilities:**
- Start Appium server on specified port
- Detect if server already running
- Health check (HTTP call to `/status`)
- Graceful shutdown
- Handle port conflicts via `portfinder`

**Key decisions:**
- Allow config to specify remote Appium server (future feature, for cloud support)
- Auto-allocate port if not specified

**Interface:**
```typescript
export class AppiumServer {
  constructor(port?: number, host?: string);
  
  async start(): Promise<void>;
  async stop(): Promise<void>;
  async isHealthy(): Promise<boolean>;
  getUrl(): string; // returns http://localhost:4723
}
```

### 1.4 React Native Device Management

**File:** `packages/appium/src/device/device-manager.ts`, `simulator.ts`, `emulator.ts`, `react-native.ts`

**Responsibilities:**
- Detect available simulators (iOS) and emulators (Android)
- Auto-launch simulators/emulators if configured
- Connect to running simulator/emulator
- Detect React Native dev server (`localhost:8081`)
- Manage app installation & launch

**Key decisions:**
- Use `simctl` for iOS, `emulator` CLI for Android
- Auto-detect React Native dev server; fallback to pre-built app
- Support both interactive (prompt user) and headless (use first available) modes

**Interface:**
```typescript
export interface Device {
  id: string;
  name: string;
  platform: 'ios' | 'android';
  simulator: boolean;
}

export class DeviceManager {
  async detectDevices(platform: 'ios' | 'android'): Promise<Device[]>;
  async selectDevice(devices: Device[], headless?: boolean): Promise<Device>;
  async launchSimulator(device: Device): Promise<void>;
  async prepare(device: Device): Promise<void>;
  async cleanup(): Promise<void>;
}

export class ReactNativeDeviceHelper {
  async detectDevServer(): Promise<string | null>; // returns host:port
  async installApp(appPath: string, device: Device): Promise<void>;
  async launchApp(appId: string, device: Device): Promise<void>;
}
```

### 1.5 Configuration System

**File:** `packages/appium/src/config/`

**Responsibilities:**
- Define config schema (extends core `ZosmaConfig`)
- Load from `zosma.config.ts`
- Apply smart defaults
- Validate config
- Build Appium WebDriver capabilities

**Key decisions:**
- For React Native: default `platformName: 'ReactNative'`, but allow override
- Auto-detect app path from common React Native structure
- Auto-detect simulator from running processes
- Expose raw `capabilities` override for advanced users

**Types:**
```typescript
export interface AppiumConfig extends ZosmaConfig {
  platformName: 'ReactNative' | 'iOS' | 'Android' | 'Flutter';
  appPath?: string;           // auto-detected if not provided
  appId?: string;             // e.g., 'com.example.app'
  deviceName?: string;        // auto-detected if not provided
  automationName?: string;    // auto-detected based on platform
  appiumPort?: number;        // auto-allocated if not provided
  appiumHost?: string;        // default: 'localhost'
  autoLaunchSimulator?: boolean; // default: true
  capabilities?: Record<string, unknown>; // user overrides
  testDir?: string;           // default: './tests'
  workers?: number;           // default: 1 (mobile is usually serial)
  timeout?: number;           // test timeout in ms
}

export async function loadAppiumConfig(base: RunnerConfig): Promise<AppiumConfig> {
  // 1. Merge user config with defaults
  // 2. Auto-detect missing values
  // 3. Validate required fields
  // 4. Return normalized config
}

export function buildCapabilities(config: AppiumConfig): Capabilities {
  // Build WebdriverIO-compatible capabilities object
}
```

**Smart defaults logic:**
```typescript
const DEFAULTS: Partial<AppiumConfig> = {
  platformName: 'ReactNative',
  automationName: 'XCUITest', // iOS; would be UIAutomator2 for Android
  appiumPort: 4723,
  appiumHost: 'localhost',
  autoLaunchSimulator: true,
  testDir: './tests',
  workers: 1,
  timeout: 30000,
};

// Auto-detection helpers:
// - appPath: scan common RN directories (android/app/build, ios/build, etc.)
// - appId: extract from AndroidManifest.xml or Info.plist
// - deviceName: list simulators, pick first or prompt user
```

### 1.6 Test Discovery

**File:** `packages/appium/src/discovery.ts`

**Responsibilities:**
- Extend core `findTestFiles()` to support Appium patterns
- Match `.appium.ts` (TypeScript) and `.appium.py` (Python)
- Support directory patterns like `tests/appium/`, `tests/mobile/`, etc.

**Interface:**
```typescript
export async function findAppiumTests(baseDir: string): Promise<string[]> {
  // Reuse core discovery patterns but filter for .appium.* files
}
```

### 1.7 Test Helpers (Agent-Friendly Layer)

**File:** `packages/appium/src/utils/test-helpers.ts`

**Responsibilities:**
- Provide high-level, agent-readable functions
- Wrap raw WebDriver calls with sensible defaults
- Support multiple locator strategies
- Built-in logging & debugging

**Key functions:**
```typescript
// Locating & interaction
export async function tapButton(
  driver: WebdriverIO.Browser,
  selector: string | { testID: string; text?: string; exact?: boolean }
): Promise<void>;

export async function fillInput(
  driver: WebdriverIO.Browser,
  text: string,
  selector: string | { label?: string; placeholder?: string; testID?: string }
): Promise<void>;

export async function swipeDown(
  driver: WebdriverIO.Browser,
  opts?: { distance?: number; duration?: number }
): Promise<void>;

export async function swipeUp(driver: WebdriverIO.Browser, opts?: {}): Promise<void>;
export async function swipeLeft(driver: WebdriverIO.Browser, opts?: {}): Promise<void>;
export async function swipeRight(driver: WebdriverIO.Browser, opts?: {}): Promise<void>;

export async function scroll(
  driver: WebdriverIO.Browser,
  direction: 'up' | 'down' | 'left' | 'right',
  opts?: { amount?: number }
): Promise<void>;

export async function takeScreenshot(
  driver: WebdriverIO.Browser,
  name: string
): Promise<string>; // returns filepath

// Assertions
export async function expectText(
  driver: WebdriverIO.Browser,
  text: string,
  opts?: { timeout?: number; exact?: boolean; visible?: boolean }
): Promise<void>;

export async function expectVisible(
  driver: WebdriverIO.Browser,
  selector: string | { testID: string },
  opts?: { timeout?: number }
): Promise<void>;

export async function expectNotVisible(
  driver: WebdriverIO.Browser,
  selector: string | { testID: string }
): Promise<void>;

export async function expectCount(
  driver: WebdriverIO.Browser,
  selector: string,
  count: number
): Promise<void>;

// Navigation & app lifecycle
export async function goBack(driver: WebdriverIO.Browser): Promise<void>;
export async function closeApp(driver: WebdriverIO.Browser): Promise<void>;
export async function launchApp(driver: WebdriverIO.Browser): Promise<void>;
export async function resetApp(driver: WebdriverIO.Browser): Promise<void>;

// Utilities
export async function wait(ms: number): Promise<void>;
export async function waitForElement(
  driver: WebdriverIO.Browser,
  selector: string,
  timeout?: number
): Promise<void>;
```

### 1.8 Test Builder & Fixtures

**File:** `packages/appium/src/test-builder.ts`

**Responsibilities:**
- Export Playwright-compatible `test()` function
- Register `driver` fixture (WebdriverIO browser instance)
- Support `test.describe()`, `test.beforeEach()`, `test.afterEach()`

**Approach:**
- Build thin wrapper around WebdriverIO's test runner (or custom implementation)
- Inject `driver` as fixture parameter
- Ensure agent compatibility (same DX as Playwright)

**Example usage:**
```typescript
import { test, expect } from '@zosmaai/zosma-qa-appium';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ driver }) => {
    // driver is a WebdriverIO.Browser instance connected to simulator
    await driver.launchApp();
  });

  test('should login successfully', async ({ driver }) => {
    await fillInput(driver, 'user@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await expectText(driver, 'Welcome back');
  });
});
```

### 1.9 Types Export

**File:** `packages/appium/src/types.ts`

**Responsibilities:**
- Export all public types for users & agents
- Keep types aligned with core `@zosmaai/zosma-qa-core`

**Exports:**
```typescript
export * from './config/types';
export * from './device/device-manager';
export * from './server/appium-server';
export type { AppiumRunner } from './runner';
export type { AppiumPlugin } from './index';

// Re-export common WebdriverIO types
export type { Browser as WebdriverIOBrowser } from 'webdriverio';
```

---

## Phase 1 Dependencies

```
webdriverio@9+          ← WebDriver protocol client
portfinder@1.0.32       ← Already in package.json (port allocation)
@zosmaai/zosma-qa-core  ← Types & interfaces
```

### Peer Dependencies
- `appium@2.0+` — Users install separately
- `@playwright/test` — NOT needed for Appium; only for TS syntax familiarity

---

## Phase 1 Build & Testing

### Build Steps
1. `cd packages/appium && pnpm build` — Compile TypeScript to CommonJS
2. `pnpm typecheck` — Ensure strict types
3. `pnpm test:appium` (future) — Unit tests for each module

### Success Criteria
- ✅ All TypeScript compiles without errors
- ✅ No `any` types or implicit `any`
- ✅ All imports use workspace aliases (`@zosmaai/...`)
- ✅ All Node.js imports use `node:` prefix
- ✅ Biome lint passes (`pnpm lint`)

---

## Implementation Order (Sequential)

1. **Config System** (foundation for everything else)
   - `src/config/types.ts`
   - `src/config/defaults.ts`
   - `src/config/capabilities.ts`
   - `src/config/loader.ts`

2. **Appium Server Management**
   - `src/server/appium-server.ts`

3. **Device Management**
   - `src/device/device-manager.ts`
   - `src/device/simulator.ts`
   - `src/device/emulator.ts`
   - `src/device/react-native.ts`

4. **Test Discovery**
   - `src/discovery.ts`

5. **Test Helpers (Agent Layer)**
   - `src/utils/locators.ts`
   - `src/utils/logger.ts`
   - `src/utils/test-helpers.ts`

6. **Test Builder**
   - `src/test-builder.ts`

7. **Core Runner & Plugin**
   - `src/runner.ts`
   - `src/index.ts`
   - `src/types.ts`

8. **Build & Verify**
   - `pnpm build`
   - `pnpm typecheck`
   - `pnpm lint:fix`

---

## Key Design Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| WebDriver Client | webdriverio@9+ | Feature-rich, well-maintained |
| Test Syntax | Playwright-style (`test()`) | Familiar to users; agent-friendly |
| Device Launch | Both auto & manual modes | Flexibility for local dev & CI |
| Config Approach | Smart defaults + overrides | Zero-config philosophy |
| Server Management | Auto-manage with portfinder | Reduces friction |
| Locator Strategies | testID-first, then text/label | React Native best practices |
| Logging | Built-in per-action logging | Debugging for agents & users |
| Error Handling | Detailed device/config errors | Better DX for setup issues |

---

## Future Considerations (Phases 2-4)

- **Phase 2:** High-level test helpers, raw WebDriver escape hatch, fixture system
- **Phase 3:** CLI integration, TypeScript & Python templates, extended agent support
- **Phase 4:** Unified reporting, CI/CD workflows, documentation & examples

---

## File Checklist (Phase 1)

```
packages/appium/src/
├── [ ] config/
│   ├── [ ] types.ts
│   ├── [ ] defaults.ts
│   ├── [ ] capabilities.ts
│   └── [ ] loader.ts
├── [ ] server/
│   └── [ ] appium-server.ts
├── [ ] device/
│   ├── [ ] device-manager.ts
│   ├── [ ] simulator.ts
│   ├── [ ] emulator.ts
│   └── [ ] react-native.ts
├── [ ] utils/
│   ├── [ ] locators.ts
│   ├── [ ] logger.ts
│   └── [ ] test-helpers.ts
├── [ ] discovery.ts
├── [ ] test-builder.ts
├── [ ] runner.ts
├── [ ] index.ts
└── [ ] types.ts
```

---

## Related Documentation

- `docs/VISION.md` — Update to include Appium Phase 2
- `AGENTS.md` — Add Appium runner & test patterns
- Future: `docs/APPIUM.md` — User guide (Phase 3+)
- Future: `docs/APPIUM_ADVANCED.md` — Advanced usage (Phase 3+)

---

## Questions & Open Items

1. **WebdriverIO vs raw Appium client?** → Decided: webdriverio (more features)
2. **Playwright-style test syntax?** → Yes, for agent familiarity
3. **Support both auto-launch & manual?** → Yes (config flag)
4. **Smart defaults for React Native?** → Yes, auto-detect app, device, appium port
5. **When to add CI/CD?** → Phase 4 (after core works locally)

---

## Glossary

- **Appium**: Open-source mobile test automation framework
- **WebDriver**: W3C protocol for browser/mobile automation
- **WebdriverIO**: JavaScript/TypeScript WebDriver client library
- **React Native**: JavaScript framework for cross-platform mobile apps
- **Simulator**: iOS emulated device (macOS only)
- **Emulator**: Android emulated device (macOS, Linux, Windows)
- **Device**: Generic term for simulator, emulator, or physical device
- **Capability**: Appium configuration option (e.g., `platformName`, `appId`)
- **Test Helper**: High-level function for test authors (e.g., `tapButton`)
- **Fixture**: Test setup/teardown context (e.g., `{ driver }`)

---

**Last updated:** March 24, 2026  
**Status:** Planning Phase 1 Implementation
