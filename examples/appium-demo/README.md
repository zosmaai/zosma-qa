# Appium Demo — Example Mobile Tests

This example project demonstrates how to write mobile tests with `@zosmaai/zosma-qa-appium`. The tests show the API patterns, test helpers, and project structure for a React Native app.

> **Note:** These example tests are for demonstration purposes. To run them against a real app, you'll need Appium installed, a simulator/emulator running, and the app built and deployed.

---

## Prerequisites

1. **Node.js** >= 18
2. **Appium** >= 2.0:

   ```bash
   npm install -g appium
   appium driver install xcuitest       # iOS
   appium driver install uiautomator2   # Android
   ```

3. **iOS:** Xcode + Xcode Command Line Tools
4. **Android:** Android Studio + Android SDK + `ANDROID_HOME` set

---

## Project Structure

```
examples/appium-demo/
├── tests/
│   ├── login.appium.ts         ← Login flow tests
│   ├── navigation.appium.ts    ← Tab and screen navigation tests
│   └── profile.appium.ts       ← User profile tests
├── zosma.config.ts             ← zosma-qa config (plugins: ['appium'])
├── package.json
└── README.md                   ← this file
```

---

## Running the Examples

### 1. Install dependencies

```bash
cd examples/appium-demo
npm install
```

### 2. Start Appium

```bash
appium
```

### 3. Launch a simulator

```bash
# iOS
xcrun simctl boot "iPhone 15"

# Android
emulator -avd Pixel_7_API_34
```

### 4. Build and install your app on the simulator

```bash
# React Native (iOS)
npx react-native run-ios

# React Native (Android)
npx react-native run-android
```

### 5. Run the tests

```bash
npx zosma-qa run
```

---

## What the Tests Demonstrate

### `tests/login.appium.ts`
- Filling text inputs by `testID`
- Tapping buttons
- Asserting visible text after navigation
- Error state validation
- Using `beforeEach` hooks for test isolation

### `tests/navigation.appium.ts`
- Tab bar navigation
- Screen transitions
- Waiting for elements to appear
- Swipe gestures
- Back navigation

### `tests/profile.appium.ts`
- Reading element text
- Scrolling to off-screen elements
- Taking screenshots
- Raw WebDriver access via `driver.$()` escape hatch

---

## Adapting for Your App

1. Update `zosma.config.ts` with your app's base URL
2. Replace `testID` values with your app's actual test IDs
3. Update assertions to match your app's UI text
4. Add additional test files following the `.appium.ts` naming pattern

---

## Learn More

- [Getting Started with Appium](../../docs/GETTING_STARTED_APPIUM.md) — full setup guide
- [Appium Package README](../../packages/appium/README.md) — API reference
- [Getting Started with Playwright](../../docs/GETTING_STARTED_PLAYWRIGHT.md) — web testing
