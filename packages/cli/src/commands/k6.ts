import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '@zosmaai/zosma-qa-core';
import { K6Runner } from '@zosmaai/zosma-qa-k6';
import chalk from 'chalk';

export interface K6RunOptions {
  type?: string;
  vus?: string;
  duration?: string;
  script?: string;
  baseUrl?: string;
}

/**
 * `zosma-qa k6 run` — execute k6 load tests.
 */
export async function runK6(options: K6RunOptions = {}): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa') + chalk.dim('  running k6 load tests'));
  console.log('');

  const runner = new K6Runner();
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  const results = await runner.run({
    testDir: config.testDir,
    baseURL: options.baseUrl ?? config.baseURL,
    browsers: [],
    reporters: [],
    ci: false,
    extraArgs: buildExtraArgs(options),
  });

  // Print summary
  console.log('');
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  if (failed > 0) {
    console.log(
      chalk.bold.red(`  ${failed} failed`) + chalk.dim(`, ${passed} passed, ${skipped} skipped`),
    );
    for (const r of results.filter((r) => r.status === 'failed')) {
      console.log(chalk.red(`    ✗ ${r.name}`) + (r.error ? chalk.dim(` — ${r.error}`) : ''));
    }
  } else if (skipped > 0 && passed === 0) {
    console.log(chalk.yellow(`  ${skipped} skipped`));
    for (const r of results.filter((r) => r.status === 'skipped')) {
      console.log(chalk.dim(`    - ${r.name}`) + (r.error ? chalk.dim(` — ${r.error}`) : ''));
    }
  } else {
    console.log(chalk.bold.green(`  ${passed} passed`));
  }
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

function buildExtraArgs(options: K6RunOptions): string[] {
  const args: string[] = [];
  if (options.type) args.push('--type', options.type);
  if (options.vus) args.push('--vus', options.vus);
  if (options.duration) args.push('--duration', options.duration);
  if (options.script) args.push('--script', options.script);
  return args;
}

/**
 * `zosma-qa k6 init` — scaffold k6 test structure.
 */
export async function initK6(): Promise<void> {
  const cwd = process.cwd();

  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa k6 init') + chalk.dim(' — scaffold k6 load tests'));
  console.log('');

  // Create k6/ directory
  const k6Dir = path.join(cwd, 'k6');
  if (!fs.existsSync(k6Dir)) {
    fs.mkdirSync(k6Dir, { recursive: true });
  }

  // Create example script
  const examplePath = path.join(k6Dir, 'example.k6.js');
  if (!fs.existsSync(examplePath)) {
    fs.writeFileSync(examplePath, EXAMPLE_SCRIPT, 'utf8');
    console.log(chalk.green(`  Created  k6/example.k6.js`));
  } else {
    console.log(chalk.dim(`  Skipped  k6/example.k6.js  (already exists)`));
  }

  // Create k6.config.ts
  const configPath = path.join(cwd, 'k6.config.ts');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, K6_CONFIG_TEMPLATE, 'utf8');
    console.log(chalk.green(`  Created  k6.config.ts`));
  } else {
    console.log(chalk.dim(`  Skipped  k6.config.ts  (already exists)`));
  }

  // Create k6-results/ directory
  const resultsDir = path.join(cwd, 'k6-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    fs.writeFileSync(path.join(resultsDir, '.gitkeep'), '', 'utf8');
  }

  console.log('');
  console.log(`${chalk.bold.green('  Ready!')}  Next steps:\n`);
  console.log(chalk.dim('  1. Install k6 (if not installed):'));
  console.log(chalk.cyan('     https://k6.io/docs/get-started/installation/'));
  console.log('');
  console.log(chalk.dim('  2. Edit k6.config.ts with your base URL and endpoints'));
  console.log('');
  console.log(chalk.dim('  3. Run your load tests:'));
  console.log(chalk.cyan('     npx zosma-qa k6 run'));
  console.log('');
}

const EXAMPLE_SCRIPT = `import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(BASE_URL);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'duration < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'summary.json';

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}
`;

const K6_CONFIG_TEMPLATE = `import { defineK6Config } from '@zosmaai/zosma-qa-k6';

export default defineK6Config({
  // baseURL: 'http://localhost:3000',
  testType: 'load',
  vus: 10,
  duration: '30s',
  // endpoints: [
  //   { method: 'GET', path: '/api/health' },
  //   { method: 'GET', path: '/api/users' },
  //   { method: 'POST', path: '/api/users', body: { name: 'test' } },
  // ],
});
`;
