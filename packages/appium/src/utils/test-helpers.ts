/**
 * High-level, agent-friendly test helpers for Appium.
 * These wrap raw WebDriver calls with sensible defaults and better readability.
 * Supports multiple locator strategies (testID, text, accessibility label, etc.)
 */

import type { Browser } from 'webdriverio';

// ─── Selector resolution ────────────────────────────────────────────────────

type SelectorInput =
  | string
  | { testID?: string; text?: string; exact?: boolean; selector?: string };
type InputSelectorInput =
  | string
  | { label?: string; placeholder?: string; testID?: string; selector?: string };

/** Escape a string for safe use inside XPath attribute selectors. */
function escapeXPath(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function resolveSelector(sel: SelectorInput): string {
  if (typeof sel === 'string') return sel;
  if (sel.selector) return sel.selector;
  if (sel.testID) return `~${sel.testID}`;
  if (sel.text) {
    const escaped = escapeXPath(sel.text);
    return `//*[contains(@text,"${escaped}") or contains(@label,"${escaped}") or contains(@value,"${escaped}")]`;
  }
  throw new Error('Selector must include at least one of: testID, text, selector, or a string');
}

function resolveInputSelector(sel: InputSelectorInput): string {
  if (typeof sel === 'string') return sel;
  if (sel.selector) return sel.selector;
  if (sel.testID) return `~${sel.testID}`;
  if (sel.label) {
    const escaped = escapeXPath(sel.label);
    return `//*[contains(@text,"${escaped}") or contains(@label,"${escaped}")]`;
  }
  if (sel.placeholder) {
    const escaped = escapeXPath(sel.placeholder);
    return `//*[contains(@text,"${escaped}") or contains(@hint,"${escaped}")]`;
  }
  throw new Error(
    'Input selector must include at least one of: testID, label, placeholder, selector, or a string',
  );
}

function getAppId(driver: Browser): string {
  const caps = driver.capabilities as Record<string, unknown>;
  const appId =
    caps['appium:bundleId'] || caps['appium:appPackage'] || caps.bundleId || caps.appPackage;
  if (!appId) {
    throw new Error(
      'Cannot determine app ID from capabilities. Set appium:bundleId (iOS) or appium:appPackage (Android).',
    );
  }
  return String(appId);
}

// ─── Interaction helpers ────────────────────────────────────────────────────

/**
 * Tap/click a button by testID or text.
 */
export async function tapButton(
  driver: Browser,
  selector: string | { testID?: string; text?: string; exact?: boolean; selector?: string },
): Promise<void> {
  const sel = resolveSelector(selector);
  try {
    const el = await driver.$(sel);
    await el.waitForExist({ timeout: 5000 });
    await el.click();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`tapButton failed for selector "${sel}": ${msg}`);
  }
}

/**
 * Fill text input by label or testID.
 */
export async function fillInput(
  driver: Browser,
  text: string,
  selector: string | { label?: string; placeholder?: string; testID?: string; selector?: string },
): Promise<void> {
  const sel = resolveInputSelector(selector);
  try {
    const el = await driver.$(sel);
    await el.waitForExist({ timeout: 5000 });
    await el.clearValue();
    await el.setValue(text);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`fillInput failed for selector "${sel}" with text "${text}": ${msg}`);
  }
}

/**
 * Assert text is visible on screen.
 */
export async function expectText(
  driver: Browser,
  text: string,
  opts?: { timeout?: number; exact?: boolean; visible?: boolean },
): Promise<void> {
  const timeout = opts?.timeout ?? 5000;
  const escaped = escapeXPath(text);
  const xpath = opts?.exact
    ? `//*[@text="${escaped}" or @label="${escaped}" or @value="${escaped}"]`
    : `//*[contains(@text,"${escaped}") or contains(@label,"${escaped}") or contains(@value,"${escaped}")]`;

  try {
    const el = await driver.$(xpath);
    await el.waitForExist({ timeout });
    if (opts?.visible) {
      await el.waitForDisplayed({ timeout });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`expectText failed — could not find text "${text}": ${msg}`);
  }
}

/**
 * Assert element is visible.
 */
export async function expectVisible(
  driver: Browser,
  selector: string | { testID: string },
  opts?: { timeout?: number },
): Promise<void> {
  const sel = typeof selector === 'string' ? selector : `~${selector.testID}`;
  const timeout = opts?.timeout ?? 5000;
  try {
    const el = await driver.$(sel);
    await el.waitForDisplayed({ timeout });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`expectVisible failed for "${sel}": ${msg}`);
  }
}

// ─── Gesture helpers ────────────────────────────────────────────────────────

async function performSwipe(
  driver: Browser,
  direction: 'down' | 'up' | 'left' | 'right',
  opts?: { distance?: number; duration?: number },
): Promise<void> {
  const { width, height } = await driver.getWindowSize();
  const distance = opts?.distance ?? 0.6;
  const duration = opts?.duration ?? 300;

  const centerX = Math.round(width / 2);
  const centerY = Math.round(height / 2);
  const offsetX = Math.round((width * distance) / 2);
  const offsetY = Math.round((height * distance) / 2);

  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;

  switch (direction) {
    case 'down':
      startX = centerX;
      startY = centerY - offsetY;
      endX = centerX;
      endY = centerY + offsetY;
      break;
    case 'up':
      startX = centerX;
      startY = centerY + offsetY;
      endX = centerX;
      endY = centerY - offsetY;
      break;
    case 'left':
      startX = centerX + offsetX;
      startY = centerY;
      endX = centerX - offsetX;
      endY = centerY;
      break;
    case 'right':
      startX = centerX - offsetX;
      startY = centerY;
      endX = centerX + offsetX;
      endY = centerY;
      break;
  }

  await driver
    .action('pointer', { parameters: { pointerType: 'touch' } })
    .move({ x: startX, y: startY })
    .down({ button: 0 })
    .pause(duration)
    .move({ x: endX, y: endY })
    .up({ button: 0 })
    .perform();
}

/**
 * Swipe down on screen.
 */
export async function swipeDown(
  driver: Browser,
  opts?: { distance?: number; duration?: number },
): Promise<void> {
  await performSwipe(driver, 'down', opts);
}

/**
 * Swipe up on screen.
 */
export async function swipeUp(
  driver: Browser,
  opts?: { distance?: number; duration?: number },
): Promise<void> {
  await performSwipe(driver, 'up', opts);
}

/**
 * Swipe left on screen.
 */
export async function swipeLeft(
  driver: Browser,
  opts?: { distance?: number; duration?: number },
): Promise<void> {
  await performSwipe(driver, 'left', opts);
}

/**
 * Swipe right on screen.
 */
export async function swipeRight(
  driver: Browser,
  opts?: { distance?: number; duration?: number },
): Promise<void> {
  await performSwipe(driver, 'right', opts);
}

// ─── Utility helpers ────────────────────────────────────────────────────────

/**
 * Take a screenshot.
 */
export async function takeScreenshot(driver: Browser, name: string): Promise<string> {
  const filename = `screenshot_${name}_${Date.now()}.png`;
  try {
    await driver.saveScreenshot(filename);
    return filename;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`takeScreenshot failed for "${name}": ${msg}`);
  }
}

/**
 * Wait for element to appear.
 */
export async function waitForElement(
  driver: Browser,
  selector: string,
  timeout?: number,
): Promise<void> {
  try {
    const el = await driver.$(selector);
    await el.waitForExist({ timeout: timeout ?? 10000 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `waitForElement timed out after ${timeout ?? 10000}ms for selector "${selector}": ${msg}`,
    );
  }
}

/**
 * Go back (press back button or navigate back).
 */
export async function goBack(driver: Browser): Promise<void> {
  await driver.back();
}

// ─── App lifecycle helpers ──────────────────────────────────────────────────

/**
 * Close the app.
 */
export async function closeApp(driver: Browser): Promise<void> {
  const appId = getAppId(driver);
  try {
    await driver.execute('mobile: terminateApp', { bundleId: appId, appId });
  } catch {
    // Fallback for older Appium / different driver implementations
    await (driver as unknown as { closeApp: () => Promise<void> }).closeApp();
  }
}

/**
 * Launch the app.
 */
export async function launchApp(driver: Browser): Promise<void> {
  const appId = getAppId(driver);
  try {
    await driver.execute('mobile: activateApp', { bundleId: appId, appId });
  } catch {
    // Fallback for older Appium / different driver implementations
    await (driver as unknown as { launchApp: () => Promise<void> }).launchApp();
  }
}

/**
 * Reset app to initial state (terminate + relaunch).
 */
export async function resetApp(driver: Browser): Promise<void> {
  await closeApp(driver);
  await launchApp(driver);
}

/**
 * Wait for specified milliseconds.
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
