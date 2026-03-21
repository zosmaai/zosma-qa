import { spawn } from 'child_process';
import chalk from 'chalk';

/**
 * `zosma-qa report` — opens the Playwright HTML report in the default browser.
 */
export async function openReport(): Promise<void> {
  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa') + chalk.dim('  opening HTML report…'));
  console.log('');

  const exitCode = await spawnAsync('npx', ['playwright', 'show-report']);

  if (exitCode !== 0) {
    console.log(chalk.yellow('\n  No report found. Run tests first:'));
    console.log(chalk.dim('    npx zosma-qa run\n'));
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
