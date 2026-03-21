import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '@zosmaai/zosma-qa-core';
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
 * `zosma-qa run` — detects the active runner from zosma.config and delegates
 * to the appropriate process:
 *   - plugins: ['pytest']     → `uv run pytest` (if uv.lock present) or `python -m pytest`
 *   - plugins: ['playwright'] → `npx playwright test` (default)
 */
export async function runTests(options: RunOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  const isPython = config.plugins.includes('pytest');

  if (isPython) {
    await runPytest(options, config.testDir ?? './tests', cwd);
  } else {
    await runPlaywright(options, cwd);
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
