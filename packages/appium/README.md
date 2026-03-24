# @zosmaai/zosma-qa-appium

Appium mobile testing runner for [zosma-qa](https://github.com/zosmaai/zosma-qa) — the open-source QA platform for Web, Mobile, Backend, and Load testing.

This package provides a Playwright-like test API for mobile apps, powered by WebdriverIO and Appium. It includes agent-friendly test helpers, automatic device detection, and zero-config defaults for React Native projects.

## Installation

```bash
npm install -D @zosmaai/zosma-qa-appium
```

**Peer dependency:** You'll need Appium installed globally or locally:

```bash
npm install -g appium
appium driver install uiautomator2   # Android
appium driver install xcuitest       # iOS
```

## Usage

### Write a test

```typescript
// tests/login.appium.ts
import { test } from '@zosmaai/zosma-qa-appium';
import { tapButton, fillInput, expectText } from '@zosmaai/zosma-qa-appium';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ driver }) => {
    // driver is a WebdriverIO Browser instance
  });

  test('should login with valid credentials', async ({ driver }) => {
    await fillInput(driver, 'user@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await expectText(driver, 'Welcome back');
  });
});
```

### Configure

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'localhost',
  browsers: ['chromium'],
});
```

## Features

| Feature | Description |
|---|---|
| **Playwright-like API** | `test()`, `test.describe()`, `test.beforeEach()`, `test.afterEach()` |
| **Fixture injection** | Tests receive `{ driver }` — a WebdriverIO Browser instance |
| **Agent-friendly helpers** | `tapButton()`, `fillInput()`, `swipeDown()`, `expectText()`, `waitForElement()` |
| **Auto-detection** | Finds app path, app ID, and dev server automatically for React Native projects |
| **Session management** | Handles WebdriverIO session lifecycle with retry and cleanup |
| **Device management** | iOS Simulator and Android Emulator detection and control |
| **Server management** | Starts and stops Appium server automatically with port allocation |
| **Multi-platform** | React Native, iOS, Android, Flutter, React Native Web |

## Test Helpers

High-level, agent-readable functions that wrap raw WebDriver calls:

```typescript
import {
  tapButton,       // Tap a button by testID or text
  fillInput,       // Fill a text input
  expectText,      // Assert text is visible on screen
  waitForElement,  // Wait for an element to appear
  swipeDown,       // Swipe down gesture
  swipeUp,         // Swipe up gesture
  scrollToElement, // Scroll until element is visible
  takeScreenshot,  // Capture screenshot
} from '@zosmaai/zosma-qa-appium';
```

Each helper supports multiple locator strategies:

```typescript
// By testID (recommended)
await tapButton(driver, { testID: 'submit-btn' });

// By visible text
await tapButton(driver, { text: 'Submit' });

// By raw selector
await tapButton(driver, '~submit-btn');
```

## Platform Support

| Platform | Automation Engine | Status |
|---|---|---|
| React Native | XCUITest (iOS) / UIAutomator2 (Android) | Available |
| iOS Native | XCUITest | Available |
| Android Native | UIAutomator2 | Available |
| Flutter | Flutter driver | Available |
| React Native Web | Chromium | Available |

## Smart Defaults

The runner applies sensible defaults so you can start testing without configuration:

| Setting | Default | Notes |
|---|---|---|
| `platformName` | `ReactNative` | Auto-detected from project |
| `appiumPort` | `4723` | Auto-allocated if busy |
| `appiumHost` | `localhost` | |
| `testDir` | `./tests` | |
| `workers` | `1` | Mobile tests run serially |
| `timeout` | `30000` | 30 seconds per test |
| `autoLaunchSimulator` | `true` | Launches simulator if needed |

## Advanced: Raw WebDriver Access

The `driver` fixture is a standard WebdriverIO `Browser` instance. Use it directly for anything the helpers don't cover:

```typescript
test('advanced interaction', async ({ driver }) => {
  const element = await driver.$('~my-element');
  await element.click();

  const text = await element.getText();
  expect.toBe(text, 'Expected value');
});
```

## Part of zosma-qa

- [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) — shared types and plugin interface
- [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) — Playwright runner and base config
- [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) — interactive CLI (`npx zosma-qa`)
- [`@zosmaai/zosma-qa-appium`](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) — this package

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
