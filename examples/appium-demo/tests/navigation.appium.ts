/**
 * Tab and screen navigation tests — demonstrates tapping tabs,
 * waiting for elements, swipe gestures, and back navigation.
 */
import {
  expectText,
  expectVisible,
  fillInput,
  goBack,
  swipeDown,
  swipeLeft,
  tapButton,
  test,
  waitForElement,
} from '@zosmaai/zosma-qa-appium';

test.describe('Navigation', () => {
  test.beforeEach(async ({ driver }) => {
    // Log in before each test to reach the main app
    await fillInput(driver, 'demo@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });
    await waitForElement(driver, '~home-screen', 5000);
  });

  test('shows bottom tab bar with all tabs', async ({ driver }) => {
    await expectVisible(driver, { testID: 'tab-bar' });
    await expectText(driver, 'Home');
    await expectText(driver, 'Search');
    await expectText(driver, 'Notifications');
    await expectText(driver, 'Profile');
  });

  test('navigates to Search tab', async ({ driver }) => {
    await tapButton(driver, { testID: 'tab-search' });
    await expectVisible(driver, { testID: 'search-screen' });
    await expectVisible(driver, { testID: 'search-input' });
    await expectText(driver, 'Search');
  });

  test('navigates to Notifications tab', async ({ driver }) => {
    await tapButton(driver, { testID: 'tab-notifications' });
    await expectVisible(driver, { testID: 'notifications-screen' });
    await expectText(driver, 'Notifications');
  });

  test('navigates to Profile tab', async ({ driver }) => {
    await tapButton(driver, { testID: 'tab-profile' });
    await expectVisible(driver, { testID: 'profile-screen' });
    await expectText(driver, 'Profile');
  });

  test('navigates back from detail screen', async ({ driver }) => {
    // Tap a list item to go to a detail screen
    await tapButton(driver, { testID: 'item-1' });
    await waitForElement(driver, '~detail-screen', 3000);
    await expectVisible(driver, { testID: 'detail-screen' });

    // Go back
    await goBack(driver);
    await expectVisible(driver, { testID: 'home-screen' });
  });

  test('pull-to-refresh on home screen', async ({ driver }) => {
    await expectVisible(driver, { testID: 'home-screen' });

    // Pull down to trigger refresh
    await swipeDown(driver, { distance: 300, duration: 500 });

    // Wait for refresh indicator to disappear
    await waitForElement(driver, '~home-list', 5000);
  });

  test('swipe through onboarding cards', async ({ driver }) => {
    // Navigate to a screen with horizontal swipe cards
    await tapButton(driver, { testID: 'onboarding-link' });
    await waitForElement(driver, '~onboarding-screen', 3000);

    // Swipe through cards
    await expectText(driver, 'Step 1');
    await swipeLeft(driver, { distance: 250, duration: 300 });
    await expectText(driver, 'Step 2');
    await swipeLeft(driver, { distance: 250, duration: 300 });
    await expectText(driver, 'Step 3');
  });

  test('deep link navigation preserves back stack', async ({ driver }) => {
    // Navigate: Home → Search → Item Detail
    await tapButton(driver, { testID: 'tab-search' });
    await fillInput(driver, 'test query', { testID: 'search-input' });
    await tapButton(driver, { testID: 'search-result-1' });
    await expectVisible(driver, { testID: 'detail-screen' });

    // Going back should return to search, not home
    await goBack(driver);
    await expectVisible(driver, { testID: 'search-screen' });

    // Going back again should return to home
    await goBack(driver);
    await expectVisible(driver, { testID: 'home-screen' });
  });
});
