import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['appium'],
  baseURL: 'http://localhost:4723',
  browsers: ['chromium'], // ignored by Appium — required by config schema
});
