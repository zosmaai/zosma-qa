import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['pytest'],
  testDir: './tests',
  baseURL: 'http://localhost:3000',
  browsers: ['chromium'],
});
