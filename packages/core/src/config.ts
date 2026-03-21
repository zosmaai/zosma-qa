import type { ZosmaConfig } from './types';

const DEFAULTS: ZosmaConfig = {
  plugins: ['playwright'],
  testDir: './tests',
  reporters: ['html', 'list'],
};

/**
 * Define the zosma-qa configuration with sensible defaults applied.
 * Use this in your zosma.config.ts.
 *
 * @example
 * // zosma.config.ts
 * import { defineConfig } from '@zosmaai/zosma-qa-core';
 * export default defineConfig({
 *   baseURL: 'https://www.myapp.com',
 *   browsers: ['chromium', 'firefox'],
 * });
 */
export function defineConfig(overrides: Partial<ZosmaConfig> = {}): ZosmaConfig {
  return {
    ...DEFAULTS,
    ...overrides,
    // Array fields: override entirely if provided, don't merge
    plugins: overrides.plugins ?? DEFAULTS.plugins,
    reporters: overrides.reporters ?? DEFAULTS.reporters,
  };
}

/**
 * Attempt to load zosma.config.ts / zosma.config.js from the current
 * working directory. Falls back to defaults if not found.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<ZosmaConfig> {
  const candidates = [
    `${cwd}/zosma.config.ts`,
    `${cwd}/zosma.config.js`,
    `${cwd}/zosma.config.mjs`,
  ];

  for (const file of candidates) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(file);
      const config = mod.default ?? mod;
      return defineConfig(config);
    } catch {
      // file not found or parse error — try next
    }
  }

  return defineConfig();
}
