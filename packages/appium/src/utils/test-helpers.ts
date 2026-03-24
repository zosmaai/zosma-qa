/**
 * High-level, agent-friendly test helpers for Appium.
 * These wrap raw WebDriver calls with sensible defaults and better readability.
 * Supports multiple locator strategies (testID, text, accessibility label, etc.)
 */

// Placeholder types (will be replaced with actual WebdriverIO types)
export interface Browser {
  $: (selector: string) => Promise<unknown>;
  $$: (selector: string) => Promise<unknown[]>;
  [key: string]: any;
}

/**
 * Tap/click a button by testID or text.
 */
export async function tapButton(
  _driver: Browser,
  selector: string | { testID?: string; text?: string; exact?: boolean; selector?: string },
): Promise<void> {
  // Placeholder: would use driver.$ to locate button and click it
  console.log(`Tapping button:`, selector);
}

/**
 * Fill text input by label or testID.
 */
export async function fillInput(
  _driver: Browser,
  text: string,
  selector: string | { label?: string; placeholder?: string; testID?: string },
): Promise<void> {
  // Placeholder: would locate input and fill text
  console.log(`Filling input:`, selector, `with text:`, text);
}

/**
 * Assert text is visible on screen.
 */
export async function expectText(
  _driver: Browser,
  text: string,
  _opts?: { timeout?: number; exact?: boolean; visible?: boolean },
): Promise<void> {
  // Placeholder
  console.log(`Expecting text: ${text}`);
}

/**
 * Assert element is visible.
 */
export async function expectVisible(
  _driver: Browser,
  selector: string | { testID: string },
  _opts?: { timeout?: number },
): Promise<void> {
  // Placeholder
  console.log(
    `Expecting element visible: ${typeof selector === 'string' ? selector : selector.testID}`,
  );
}

/**
 * Swipe down on screen.
 */
export async function swipeDown(
  _driver: Browser,
  _opts?: { distance?: number; duration?: number },
): Promise<void> {
  // Placeholder
  console.log(`Swiping down`);
}

/**
 * Swipe up on screen.
 */
export async function swipeUp(
  _driver: Browser,
  _opts?: { distance?: number; duration?: number },
): Promise<void> {
  // Placeholder
  console.log(`Swiping up`);
}

/**
 * Swipe left on screen.
 */
export async function swipeLeft(
  _driver: Browser,
  _opts?: { distance?: number; duration?: number },
): Promise<void> {
  // Placeholder
  console.log(`Swiping left`);
}

/**
 * Swipe right on screen.
 */
export async function swipeRight(
  _driver: Browser,
  _opts?: { distance?: number; duration?: number },
): Promise<void> {
  // Placeholder
  console.log(`Swiping right`);
}

/**
 * Take a screenshot.
 */
export async function takeScreenshot(_driver: Browser, name: string): Promise<string> {
  // Placeholder
  console.log(`Taking screenshot: ${name}`);
  return `screenshot_${name}.png`;
}

/**
 * Wait for element to appear.
 */
export async function waitForElement(
  _driver: Browser,
  selector: string,
  _timeout?: number,
): Promise<void> {
  // Placeholder
  console.log(`Waiting for element: ${selector}`);
}

/**
 * Go back (press back button or navigate back).
 */
export async function goBack(_driver: Browser): Promise<void> {
  // Placeholder
  console.log(`Going back`);
}

/**
 * Close the app.
 */
export async function closeApp(_driver: Browser): Promise<void> {
  // Placeholder
  console.log(`Closing app`);
}

/**
 * Launch the app.
 */
export async function launchApp(_driver: Browser): Promise<void> {
  // Placeholder
  console.log(`Launching app`);
}

/**
 * Reset app to initial state.
 */
export async function resetApp(_driver: Browser): Promise<void> {
  // Placeholder
  console.log(`Resetting app`);
}

/**
 * Wait for specified milliseconds.
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
