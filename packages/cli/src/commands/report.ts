import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

/**
 * `zosma-qa report` — opens the Playwright HTML report in the default browser.
 */
export async function openReport(): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa') + chalk.dim('  opening HTML report…'));
  console.log('');

  const cwd = process.cwd();

  const explicitDir = process.env.PLAYWRIGHT_HTML_REPORT;

  const candidates: string[] = [];
  if (explicitDir) candidates.push(explicitDir);

  candidates.push('playwright-report');
  candidates.push(path.join('examples', 'zosma-ai', 'playwright-report'));

  const reportDir = candidates.find((dir) => {
    const indexPath = path.join(cwd, dir, 'index.html');
    return fs.existsSync(indexPath);
  });

  const args = ['playwright', 'show-report'];
  if (reportDir && reportDir !== 'playwright-report') {
    args.push(reportDir);
  }

  const exitCode = await spawnAsync('npx', args);

  if (exitCode !== 0) {
    console.log(chalk.yellow('\n  No report found. Run tests first:'));
    console.log(chalk.dim('    npx zosma-qa run\n'));
    console.log(
      chalk.dim('  If you ran the zosma.ai example suite, use: ') +
        chalk.cyan('pnpm test:examples && npx zosma-qa report'),
    );
    process.exit(exitCode);
  }
}

function spawnAsync(cmd: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
    });
    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', reject);
  });
}
