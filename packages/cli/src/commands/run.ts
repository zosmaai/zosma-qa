import { spawn } from 'child_process';
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
 * `zosma-qa run` — delegates to `npx playwright test` with all flags
 * forwarded so the full Playwright feature set remains available.
 */
export async function runTests(options: RunOptions = {}): Promise<void> {
  const args = buildArgs(options);

  console.log('');
  console.log(
    chalk.bold.cyan('  zosma-qa') +
      chalk.dim('  running: ') +
      chalk.white(`npx playwright ${args.join(' ')}`),
  );
  console.log('');

  const exitCode = await spawnPlaywright(args);

  if (exitCode !== 0) {
    console.log('');
    console.log(
      chalk.dim(`  View the report: `) + chalk.cyan('npx zosma-qa report'),
    );
    process.exit(exitCode);
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildArgs(options: RunOptions): string[] {
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

function spawnPlaywright(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['playwright', ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
    });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}
