/**
 * Login flow tests — demonstrates filling inputs, tapping buttons,
 * asserting visible text, and error-state validation.
 */
import {
  expect,
  expectText,
  expectVisible,
  fillInput,
  resetApp,
  tapButton,
  test,
} from '@zosmaai/zosma-qa-appium';

test.describe('Login', () => {
  test.beforeEach(async ({ driver }) => {
    await resetApp(driver);
  });

  test('shows login screen on launch', async ({ driver }) => {
    await expectVisible(driver, { testID: 'login-screen' });
    await expectText(driver, 'Welcome Back');
  });

  test('can log in with valid credentials', async ({ driver }) => {
    await fillInput(driver, 'demo@example.com', { testID: 'email-input' });
    await fillInput(driver, 'password123', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });

    // Should navigate to home screen after login
    await expectVisible(driver, { testID: 'home-screen' }, { timeout: 5000 });
    await expectText(driver, 'Dashboard');
  });

  test('shows error for invalid credentials', async ({ driver }) => {
    await fillInput(driver, 'bad@example.com', { testID: 'email-input' });
    await fillInput(driver, 'wrong', { testID: 'password-input' });
    await tapButton(driver, { testID: 'login-button' });

    await expectText(driver, 'Invalid email or password', { timeout: 3000 });
    // Should stay on login screen
    await expectVisible(driver, { testID: 'login-screen' });
  });

  test('validates required fields', async ({ driver }) => {
    // Tap login without filling fields
    await tapButton(driver, { testID: 'login-button' });

    await expectText(driver, 'Email is required');
    await expectText(driver, 'Password is required');
  });

  test('navigates to forgot password', async ({ driver }) => {
    await tapButton(driver, { text: 'Forgot Password?' });
    await expectVisible(driver, { testID: 'forgot-password-screen' });
    await expectText(driver, 'Reset Password');
  });

  test('navigates to sign up', async ({ driver }) => {
    await tapButton(driver, { text: 'Sign Up' });
    await expectVisible(driver, { testID: 'signup-screen' });
    await expectText(driver, 'Create Account');

    // Verify all signup fields are present
    await expectVisible(driver, { testID: 'name-input' });
    await expectVisible(driver, { testID: 'email-input' });
    await expectVisible(driver, { testID: 'password-input' });
    await expectVisible(driver, { testID: 'confirm-password-input' });
  });

  test.afterEach(async ({ driver }) => {
    // Capture state for debugging if a test fails
    expect.toBeTruthy(driver);
  });
});
