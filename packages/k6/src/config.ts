import type { K6Config } from './types';

const DEFAULTS: K6Config = {
  testType: 'load',
  vus: 10,
  duration: '30s',
  thresholds: [
    { metric: 'http_req_duration', condition: 'p(95)<500' },
    { metric: 'http_req_failed', condition: 'rate<0.01' },
  ],
  k6BinaryPath: 'k6',
  timeoutSeconds: 300,
  testDir: './k6',
  testMatch: '*.k6.js',
  outputDir: './k6-results',
};

/**
 * Define k6 configuration with sensible defaults applied.
 * Use this in your k6.config.ts.
 *
 * @example
 * import { defineK6Config } from '@zosmaai/zosma-qa-k6';
 * export default defineK6Config({
 *   baseURL: 'http://localhost:3000',
 *   vus: 50,
 *   duration: '2m',
 * });
 */
export function defineK6Config(overrides: Partial<K6Config> = {}): K6Config {
  return {
    ...DEFAULTS,
    ...overrides,
    thresholds: overrides.thresholds ?? DEFAULTS.thresholds,
  };
}

/**
 * Attempt to load k6.config.ts / k6.config.js from the working directory.
 * Falls back to defaults if not found.
 */
export async function loadK6Config(cwd: string = process.cwd()): Promise<K6Config> {
  const candidates = [`${cwd}/k6.config.ts`, `${cwd}/k6.config.js`, `${cwd}/k6.config.mjs`];

  for (const file of candidates) {
    try {
      const mod = require(file);
      const config = mod.default ?? mod;
      return defineK6Config(config);
    } catch {
      // file not found or parse error — try next
    }
  }

  return defineK6Config();
}
