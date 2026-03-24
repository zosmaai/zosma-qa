# Getting Started with Appium (Mobile Testing)

This guide covers setting up zosma-qa for mobile app testing on iOS and Android using Appium and WebdriverIO.

---

## Prerequisites

### Required

- **Node.js** >= 18
- **Appium** >= 2.0

  ```bash
  npm install -g appium
  ```

### iOS Testing

- **macOS** (required for iOS simulators)
- **Xcode** — install from the Mac App Store
- **Xcode Command Line Tools**:

  ```bash
  xcode-select --install
  ```

- **XCUITest driver**:

  ```bash
  appium driver install xcuitest
  ```

### Android Testing

- **Android Studio** — [download here](https://developer.android.com/studio)
- **Android SDK** — installed via Android Studio
- **`ANDROID_HOME`** environment variable set:

  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
  export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
  ```

- **UIAutomator2 driver**:

  ```bash
  appium driver install uiautomator2
  ```

### Verify Setup

```bash
appium --version          # Should print 2.x
appium driver list        # Should show xcuitest and/or uiautomator2
```

---

## Installation

```bash
npm install -D @zosmaai/zosma-qa-appium @zosmaai/zosma-qa-core
```

---

## Project Setup

### 1. Create the config file

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'localhost',
  browsers: ['chromium'],
});
```

### 2. Create your first test

```typescript
// tests/login.appium.ts
import { test } from '@zosmaai/zosma-qa-appium';
import { tapButton, fillInput, expectText } from '@zosmaai/zosma-qa-appium';

test.describe('Login Flow', () => {
  test('should login with valid credentials', async ({ driver }) => {
    await fillInput(driver, 'user@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await expectText(driver, 'Welcome back');
  });

  test('should show error for invalid credentials', async ({ driver }) => {
    await fillInput(driver, 'wrong@example.com', { testID: 'email-input' });
    await fillInput(driver, 'wrongpass', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await expectText(driver, 'Invalid credentials');
  });
});
```

### 3. Run your tests

Start Appium in one terminal:

```bash
appium
```

Run your tests:

```bash
npx zosma-qa run
```

---

## Test File Naming

Appium tests use the `.appium.ts` or `.appium.py` extension to distinguish them from web tests:

```
tests/
├── login.appium.ts       ← mobile test (Appium)
├── navigation.appium.ts  ← mobile test (Appium)
├── home.spec.ts          ← web test (Playwright)
└── api.test.ts           ← API test
```

This convention lets you run web and mobile tests from the same project using different runners.

---

## Test API

### test() function

The test API mirrors Playwright for familiarity:

```typescript
import { test, expect } from '@zosmaai/zosma-qa-appium';

test.describe('Suite name', () => {
  test.beforeEach(async ({ driver }) => {
    // runs before each test
  });

  test.afterEach(async ({ driver }) => {
    // runs after each test
  });

  test('test name', async ({ driver }) => {
    // driver is a WebdriverIO Browser instance
  });
});
```

### Fixture: `{ driver }`

Every test receives a `driver` fixture — a [WebdriverIO Browser](https://webdriver.io/docs/api/browser) instance connected to your Appium server. Use it for raw WebDriver access:

```typescript
test('raw WebDriver access', async ({ driver }) => {
  const el = await driver.$('~my-element');
  await el.click();
  const text = await el.getText();
  expect.toBe(text, 'Hello');
});
```

---

## Agent-Friendly Test Helpers

These high-level functions are designed to be readable by both humans and AI agents:

### tapButton

```typescript
import { tapButton } from '@zosmaai/zosma-qa-appium';

// By testID (recommended for React Native)
await tapButton(driver, { testID: 'submit-btn' });

// By visible text
await tapButton(driver, { text: 'Submit' });

// By raw accessibility selector
await tapButton(driver, '~submit-btn');
```

### fillInput

```typescript
import { fillInput } from '@zosmaai/zosma-qa-appium';

await fillInput(driver, 'user@example.com', { testID: 'email-input' });
await fillInput(driver, 'search term', { text: 'Search' });
```

### expectText

```typescript
import { expectText } from '@zosmaai/zosma-qa-appium';

// Assert text is visible on screen
await expectText(driver, 'Welcome back');
await expectText(driver, 'Order confirmed');
```

### waitForElement

```typescript
import { waitForElement } from '@zosmaai/zosma-qa-appium';

await waitForElement(driver, { testID: 'loading-spinner' }, { timeout: 10000 });
```

### Gestures

```typescript
import { swipeDown, swipeUp, scrollToElement } from '@zosmaai/zosma-qa-appium';

await swipeDown(driver);
await swipeUp(driver);
await scrollToElement(driver, { testID: 'footer-section' });
```

### Screenshots

```typescript
import { takeScreenshot } from '@zosmaai/zosma-qa-appium';

await takeScreenshot(driver, 'login-screen');
```

---

## Configuration

### Appium-specific options

Create an `appium.config.ts` (optional) alongside your `zosma.config.ts`:

```typescript
// appium.config.ts
export default {
  platformName: 'ReactNative',     // ReactNative | iOS | Android | Flutter
  appPath: './ios/build/MyApp.app', // auto-detected if omitted
  appId: 'com.mycompany.myapp',    // auto-detected if omitted
  deviceName: 'iPhone 15',         // auto-detected if omitted
  appiumPort: 4723,                // auto-allocated if omitted
  autoLaunchSimulator: true,       // default: true
  timeout: 30000,                  // 30s per test
  workers: 1,                      // mobile tests run serially
};
```

### Auto-detection

The runner automatically detects:

| Setting | Detection method |
|---|---|
| `appPath` | Scans `ios/build/` and `android/app/build/outputs/apk/` |
| `appId` | Reads from `package.json`, `AndroidManifest.xml`, or `Info.plist` |
| `deviceName` | Lists available simulators/emulators |
| `devServerUrl` | Checks `localhost:8081` for a running Metro bundler |
| `platformName` | Detects `react-native` in `package.json` dependencies |

### Platform-specific defaults

| Platform | Automation Engine | Default Port |
|---|---|---|
| React Native | XCUITest (iOS) | 4723 |
| iOS | XCUITest | 4723 |
| Android | UIAutomator2 | 4723 |
| Flutter | Flutter | 4723 |

---

## Project Structure

A typical mobile testing project:

```
my-app/
├── tests/
│   ├── login.appium.ts
│   ├── navigation.appium.ts
│   ├── cart.appium.ts
│   └── checkout.appium.ts
├── zosma.config.ts
├── appium.config.ts        ← optional
├── package.json
└── ios/                    ← React Native app
    └── build/
        └── MyApp.app
```

---

## Troubleshooting

### Appium server won't start

```bash
# Check if Appium is installed
appium --version

# Check if drivers are installed
appium driver list

# Start with debug logging
appium --log-level debug
```

### Simulator not found

```bash
# List available iOS simulators
xcrun simctl list devices

# List available Android emulators
emulator -list-avds
```

### Test timeout

Increase the timeout in your config:

```typescript
// appium.config.ts
export default {
  timeout: 60000,  // 60 seconds
};
```

### Port conflict

The runner auto-allocates ports, but you can specify one:

```typescript
// appium.config.ts
export default {
  appiumPort: 4724,  // use a different port
};
```

---

## Example Project

See [`examples/appium-demo/`](../examples/appium-demo/) for a complete example project with sample tests.

---

## Next Steps

- Explore the [Appium package README](../packages/appium/README.md) for the full API reference
- Read about [web testing with Playwright](GETTING_STARTED_PLAYWRIGHT.md)
- Read the [Architecture](ARCHITECTURE.md) doc for how the packages fit together
- Read the [Vision](VISION.md) doc for the project roadmap
