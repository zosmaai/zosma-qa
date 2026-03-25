import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Browser, TestResult } from '@zosmaai/zosma-qa-core';
import { loadConfig } from '@zosmaai/zosma-qa-core';
import { K6Runner } from '@zosmaai/zosma-qa-k6';
import chalk from 'chalk';

export interface RunOptions {
  project?: string;
  grep?: string;
  headed?: boolean;
  debug?: boolean;
  workers?: string;
  shard?: string;
  reporter?: string;
}

/**
 * `zosma-qa run` — detects the active runner(s) from zosma.config and delegates
 * to the appropriate process(es):
 *   - plugins: ['appium']     → AppiumRunner (WebdriverIO-based)
 *   - plugins: ['pytest']     → `uv run pytest` (if uv.lock present) or `python -m pytest`
 *   - plugins: ['playwright'] → `npx playwright test` (default)
 *   - plugins: ['k6']         → k6 load tests
 *
 * Multiple plugins run sequentially.
 */
export async function runTests(options: RunOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);

  for (const plugin of config.plugins) {
    if (plugin === 'appium') {
      await runAppium(config.testDir ?? './tests', config.baseURL, config.browsers ?? [], cwd);
    } else if (plugin === 'pytest') {
      await runPytest(options, config.testDir ?? './tests', cwd);
    } else if (plugin === 'k6') {
      await runK6Plugin(options, config, cwd);
    } else {
      await runPlaywright(options, cwd);
    }
  }
}

async function runK6Plugin(
  _options: RunOptions,
  config: { testDir: string; baseURL?: string },
  _cwd: string,
): Promise<void> {
  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa') + chalk.dim('  running: ') + chalk.white('k6 load tests'),
  );
  console.log('');

  const runner = new K6Runner();
  const results = await runner.run({
    testDir: config.testDir,
    baseURL: config.baseURL,
    browsers: [],
    reporters: [],
    ci: false,
  });

  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length > 0) {
    for (const r of failed) {
      console.log(chalk.red(`  ✗ ${r.name}`) + (r.error ? chalk.dim(` — ${r.error}`) : ''));
    }
    process.exit(1);
  }
}

// ─── Appium dispatch ──────────────────────────────────────────────────────────

async function runAppium(
  testDir: string,
  baseURL: string | undefined,
  browsers: string[],
  cwd: string,
): Promise<void> {
  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa') + chalk.dim('  running: ') + chalk.white('Appium tests'),
  );
  console.log('');

  try {
    const { AppiumRunner } = (await import('@zosmaai/zosma-qa-appium')) as {
      AppiumRunner: typeof import('@zosmaai/zosma-qa-appium').AppiumRunner;
    };
    const runner = new AppiumRunner({
      testDir: path.resolve(cwd, testDir),
      baseURL,
      browsers: browsers as Browser[],
      reporters: ['list'],
      ci: !process.stdout.isTTY,
    });
    const results: TestResult[] = await runner.execute();

    // Print summary
    const passed = results.filter((r) => r.status === 'passed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    console.log('');
    console.log(chalk.bold('  Results:'));
    for (const r of results) {
      const icon =
        r.status === 'passed'
          ? chalk.green('PASS')
          : r.status === 'failed'
            ? chalk.red('FAIL')
            : chalk.yellow('SKIP');
      console.log(`    ${icon}  ${r.name} (${r.duration}ms)`);
      if (r.error) {
        console.log(chalk.red(`           ${r.error}`));
      }
    }

    console.log('');
    console.log(
      `  ${chalk.green(`${passed} passed`)}` +
        (failed > 0 ? `, ${chalk.red(`${failed} failed`)}` : '') +
        (skipped > 0 ? `, ${chalk.yellow(`${skipped} skipped`)}` : ''),
    );

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`  Appium runner failed: ${msg}`));
    process.exit(1);
  }
}

// ─── pytest dispatch ───────────────────────────────────────────────────────────

function buildPytestArgs(options: RunOptions, testDir: string): string[] {
  const args: string[] = [testDir];
  if (options.grep) args.push('-k', options.grep);
  if (options.headed) args.push('--headed');
  // --project, --debug, --workers, --shard, --reporter have no pytest equivalent — silently ignored
  return args;
}

async function runPytest(options: RunOptions, testDir: string, cwd: string): Promise<void> {
  const hasUvLock = fs.existsSync(path.join(cwd, 'uv.lock'));

  let cmd: string;
  let args: string[];

  if (hasUvLock) {
    cmd = 'uv';
    args = ['run', 'pytest', ...buildPytestArgs(options, testDir)];
  } else {
    cmd = 'python';
    args = ['-m', 'pytest', ...buildPytestArgs(options, testDir)];
  }

  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa') +
      chalk.dim('  running: ') +
      chalk.white(`${cmd} ${args.join(' ')}`),
  );
  console.log('');

  const exitCode = await spawnProcess(cmd, args, cwd);

  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

// ─── Playwright dispatch ───────────────────────────────────────────────────────

function buildPlaywrightArgs(options: RunOptions): string[] {
  const args: string[] = ['test'];

  if (options.project) args.push('--project', options.project);
  if (options.grep) args.push('--grep', options.grep);
  if (options.headed) args.push('--headed');
  if (options.debug) args.push('--debug');
  if (options.workers) args.push('--workers', options.workers);
  if (options.shard) args.push('--shard', options.shard);
  if (options.reporter) args.push('--reporter', options.reporter);

  return args;
}

async function runPlaywright(options: RunOptions, cwd: string): Promise<void> {
  const args = buildPlaywrightArgs(options);

  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa') +
      chalk.dim('  running: ') +
      chalk.white(`npx playwright ${args.join(' ')}`),
  );
  console.log('');

  const exitCode = await spawnProcess('npx', ['playwright', ...args], cwd);

  if (exitCode !== 0) {
    console.log('');
    console.log(chalk.dim(`  View the report: `) + chalk.cyan('npx zosma-qa report'));
    process.exit(exitCode);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function spawnProcess(cmd: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd,
      env: { ...process.env },
    });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}
