import { spawn } from 'child_process';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import type { AgentLoop } from '@zosma-qa/core';

/**
 * `zosma-qa agents init` — prompts the user to choose their AI coding tool
 * and runs `npx playwright init-agents --loop=<choice>`.
 *
 * Supports: OpenCode (default), Claude Code, VS Code (Copilot).
 */
export async function initAgents(loopOverride?: AgentLoop): Promise<void> {
  let loop: AgentLoop;

  if (loopOverride) {
    loop = loopOverride;
  } else {
    console.log('');
    console.log(chalk.bold.cyan('  zosma-qa agents') + chalk.dim(' — Playwright AI agent setup'));
    console.log('');
    console.log(
      chalk.dim(
        '  This generates agent definitions that let your AI tool act as a\n' +
          '  Playwright planner, generator, and healer.\n',
      ),
    );

    loop = await select<AgentLoop>({
      message: 'Which AI coding tool are you using?',
      choices: [
        {
          name: 'OpenCode  (default)',
          value: 'opencode',
          description: 'opencode.ai — the AI coding agent',
        },
        {
          name: 'Claude Code',
          value: 'claude',
          description: 'Anthropic\'s Claude Code CLI (claude.ai/code)',
        },
        {
          name: 'VS Code  (Copilot)',
          value: 'vscode',
          description: 'GitHub Copilot agent mode inside VS Code',
        },
      ],
      default: 'opencode',
    });
  }

  console.log('');
  console.log(chalk.dim(`  Running: npx playwright init-agents --loop=${loop}`));
  console.log('');

  const exitCode = await spawnAsync('npx', ['playwright', 'init-agents', `--loop=${loop}`]);

  if (exitCode === 0) {
    console.log('');
    console.log(chalk.bold.green('  Agent definitions generated!'));
    console.log('');
    console.log(chalk.dim('  Three agents are now available:\n'));
    console.log(`  ${chalk.bold('🎭 planner')}    explores your app and writes a Markdown test plan`);
    console.log(`  ${chalk.bold('🎭 generator')}  turns the plan into Playwright test files`);
    console.log(`  ${chalk.bold('🎭 healer')}     runs failing tests and repairs them automatically`);
    console.log('');
    console.log(
      chalk.dim(
        '  Prompt your AI tool:\n' +
          `    "${chalk.white('Use the planner agent. Seed: tests/seed.spec.ts')}"\n`,
      ),
    );
  } else {
    console.log('');
    console.log(chalk.yellow('  Could not run playwright init-agents.'));
    console.log(
      chalk.dim(
        '  Make sure Playwright is installed:\n' +
          '    pnpm install && npx playwright install\n',
      ),
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
