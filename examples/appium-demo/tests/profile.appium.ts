/**
 * User profile tests — demonstrates reading element text, scrolling
 * to off-screen elements, taking screenshots, and raw WebDriver access.
 */
import {
  expect,
  expectText,
  expectVisible,
  fillInput,
  swipeUp,
  takeScreenshot,
  tapButton,
  test,
  waitForElement,
} from '@zosmaai/zosma-qa-appium';

test.describe('Profile', () => {
  test.beforeEach(async ({ driver }) => {
    // Log in and navigate to Profile tab
    await fillInput(driver, 'demo@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await waitForElement(driver, '~home-screen', 5000);
    await tapButton(driver, { testID: 'tab-profile' });
    await waitForElement(driver, '~profile-screen', 3000);
  });

  test('shows user profile information', async ({ driver }) => {
    await expectVisible(driver, { testID: 'profile-screen' });
    await expectText(driver, 'demo@example.com');
    await expectVisible(driver, { testID: 'profile-avatar' });
    await expectVisible(driver, { testID: 'profile-name' });
  });

  test('edits display name', async ({ driver }) => {
    await tapButton(driver, { testID: 'edit-profile-button' });
    await expectVisible(driver, { testID: 'edit-profile-screen' });

    await fillInput(driver, 'New Display Name', { testID: 'display-name-input' });
    await tapButton(driver, { testID: 'save-profile-button' });

    // Should return to profile with updated name
    await expectVisible(driver, { testID: 'profile-screen' });
    await expectText(driver, 'New Display Name');
  });

  test('scrolls to settings section', async ({ driver }) => {
    // Settings section is below the fold
    await swipeUp(driver, { distance: 400, duration: 500 });
    await swipeUp(driver, { distance: 400, duration: 500 });

    await expectVisible(driver, { testID: 'settings-section' });
    await expectText(driver, 'Settings');
    await expectText(driver, 'Notifications');
    await expectText(driver, 'Privacy');
    await expectText(driver, 'About');
  });

  test('takes profile screenshot', async ({ driver }) => {
    const path = await takeScreenshot(driver, 'profile');
    expect.toBeTruthy(path);
    // Screenshot is saved locally — path should contain 'profile'
    expect.toBeTruthy(path.includes('profile'));
  });

  test('toggles dark mode from settings', async ({ driver }) => {
    // Scroll to settings
    await swipeUp(driver, { distance: 400, duration: 500 });
    await swipeUp(driver, { distance: 400, duration: 500 });

    await tapButton(driver, { testID: 'dark-mode-toggle' });

    // Take a screenshot of dark mode for visual comparison
    await takeScreenshot(driver, 'profile-dark-mode');
  });

  test('logs out from profile', async ({ driver }) => {
    // Scroll down to find logout button
    await swipeUp(driver, { distance: 500, duration: 500 });

    await tapButton(driver, { testID: 'logout-button' });

    // Should return to login screen
    await expectVisible(driver, { testID: 'login-screen' }, { timeout: 3000 });
    await expectText(driver, 'Welcome Back');
  });

  test('uses raw WebDriver for custom assertion', async ({ driver }) => {
    // Escape hatch: use driver.$() directly for advanced scenarios
    // This demonstrates that the full WebDriver API is available
    const avatar = await driver.$('~profile-avatar');
    expect.toBeTruthy(avatar);

    // Check element attributes via raw WebDriver
    const isDisplayed = await (avatar as { isDisplayed: () => Promise<boolean> }).isDisplayed();
    expect.toBeTruthy(isDisplayed);
  });
});
