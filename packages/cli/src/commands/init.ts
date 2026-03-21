import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { checkbox, input, select } from '@inquirer/prompts';
import type { AgentLoop, Browser } from '@zosmaai/zosma-qa-core';
import chalk from 'chalk';
import ora from 'ora';

// ─── Template content ─────────────────────────────────────────────────────────

function seedSpecTemplate(baseURL: string): string {
  return `import { test, expect } from '@playwright/test';

/**
 * seed.spec.ts — entry point for Playwright AI agents.
 *
 * This test bootstraps the page context that the planner, generator,
 * and healer agents use as their starting point.
 *
 * How to use with agents:
 *   npx zosma-qa agents init        # set up agent definitions
 *   # Then prompt your AI tool:
 *   #   "Use the planner agent. Seed: tests/seed.spec.ts"
 */
test('seed', async ({ page }) => {
  await page.goto('${baseURL}');
  await expect(page).toHaveTitle(/.+/);
});
`;
}

function playwrightConfigTemplate(baseURL: string, browsers: Browser[]): string {
  const browsersJson = JSON.stringify(browsers);
  return `import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: {
    baseURL: '${baseURL}',
  },
  browsers: ${browsersJson},
});
`;
}

function zosmaConfigTemplate(baseURL: string, browsers: Browser[]): string {
  const browsersJson = JSON.stringify(browsers);
  return `import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['playwright'],
  baseURL: '${baseURL}',
  browsers: ${browsersJson},
});
`;
}

// ─── Main init command ────────────────────────────────────────────────────────

export async function runInit(): Promise<void> {
  const cwd = process.cwd();

  console.log('');
  console.log(chalk.bold.cyan('  zosma-qa') + chalk.dim(' — zero-config QA platform'));
  console.log('');

  // ── Gather inputs ──────────────────────────────────────────────────────────

  const projectName = await input({
    message: 'Project name:',
    default: '',
    transformer: (v: string) => v.trim(),
  });

  const projectDir = projectName.trim() ? path.join(cwd, projectName.trim()) : cwd;

  if (projectName.trim()) {
    console.log(chalk.dim(`  Scaffolding into ./${projectName.trim()}/`));
  } else {
    console.log(chalk.dim('  No name given — scaffolding in current directory'));
  }
  console.log('');

  const baseURL = await input({
    message: 'Base URL of the app under test:',
    default: 'http://localhost:3000',
    validate: (v: string) => (v.startsWith('http') ? true : 'Must start with http:// or https://'),
  });

  const browsers = await checkbox<Browser>({
    message: 'Which browsers to test? (space to select)',
    choices: [
      { name: 'Chromium  (recommended)', value: 'chromium', checked: true },
      { name: 'Firefox', value: 'firefox', checked: false },
      { name: 'WebKit  (Safari)', value: 'webkit', checked: false },
    ],
    validate: (v: readonly { value: Browser }[]) =>
      v.length > 0 ? true : 'Select at least one browser',
  });

  const agentLoop = await select<AgentLoop | 'skip'>({
    message: 'Set up AI agents for test generation?',
    choices: [
      {
        name: 'OpenCode  (default)',
        value: 'opencode' as AgentLoop,
        description: 'Initialise agent definitions for the OpenCode AI coding tool',
      },
      {
        name: 'Claude Code',
        value: 'claude' as AgentLoop,
        description: 'Initialise agent definitions for Claude Code (claude.ai/code)',
      },
      {
        name: 'VS Code  (Copilot)',
        value: 'vscode' as AgentLoop,
        description: 'Initialise agent definitions for GitHub Copilot in VS Code',
      },
      {
        name: 'Skip for now',
        value: 'skip' as const,
        description: 'You can always run `npx zosma-qa agents init` later',
      },
    ],
    default: 'opencode',
  });

  console.log('');

  // ── Scaffold files ─────────────────────────────────────────────────────────

  const spinner = ora();

  // tests/
  const testsDir = path.join(projectDir, 'tests');
  ensureDir(testsDir);
  const seedPath = path.join(testsDir, 'seed.spec.ts');
  if (!fs.existsSync(seedPath)) {
    fs.writeFileSync(seedPath, seedSpecTemplate(baseURL), 'utf8');
    spinner.succeed(chalk.green(`Created  tests/seed.spec.ts`));
  } else {
    spinner.info(chalk.dim(`Skipped  tests/seed.spec.ts  (already exists)`));
    spinner.stop();
  }

  // specs/
  const specsDir = path.join(projectDir, 'specs');
  ensureDir(specsDir);
  const specsKeep = path.join(specsDir, '.gitkeep');
  if (!fs.existsSync(specsKeep)) {
    fs.writeFileSync(specsKeep, '', 'utf8');
  }
  spinner.succeed(chalk.green(`Created  specs/  (AI planner writes test plans here)`));

  // playwright.config.ts
  const pwConfigPath = path.join(projectDir, 'playwright.config.ts');
  if (!fs.existsSync(pwConfigPath)) {
    fs.writeFileSync(
      pwConfigPath,
      playwrightConfigTemplate(baseURL, browsers as Browser[]),
      'utf8',
    );
    spinner.succeed(chalk.green(`Created  playwright.config.ts`));
  } else {
    spinner.info(chalk.dim(`Skipped  playwright.config.ts  (already exists)`));
    spinner.stop();
  }

  // zosma.config.ts
  const zosmaConfigPath = path.join(projectDir, 'zosma.config.ts');
  if (!fs.existsSync(zosmaConfigPath)) {
    fs.writeFileSync(zosmaConfigPath, zosmaConfigTemplate(baseURL, browsers as Browser[]), 'utf8');
    spinner.succeed(chalk.green(`Created  zosma.config.ts`));
  } else {
    spinner.info(chalk.dim(`Skipped  zosma.config.ts  (already exists)`));
    spinner.stop();
  }

  // .github/agents/
  const agentsDir = path.join(projectDir, '.github', 'agents');
  ensureDir(path.join(projectDir, '.github'));
  ensureDir(agentsDir);
  const agentsKeep = path.join(agentsDir, '.gitkeep');
  if (!fs.existsSync(agentsKeep)) {
    fs.writeFileSync(agentsKeep, '', 'utf8');
  }

  // ── Install dependencies ───────────────────────────────────────────────────

  // Ensure package.json exists so the install has somewhere to write
  const pkgJsonPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    const initSpinner = ora('Creating package.json…').start();
    try {
      await spawnAsync('npm', ['init', '-y'], cwd);
      initSpinner.succeed(chalk.green('Created  package.json'));
    } catch {
      initSpinner.warn(chalk.yellow('Could not create package.json — run `npm init -y` manually'));
    }
  }

  const pm = detectPackageManager(projectDir);
  const installSpinner = ora(
    `Installing @zosmaai/zosma-qa-playwright and @playwright/test via ${pm}…`,
  ).start();

  try {
    if (pm === 'pnpm') {
      await spawnAsync(
        'pnpm',
        ['add', '-D', '@zosmaai/zosma-qa-playwright', '@playwright/test'],
        projectDir,
      );
    } else if (pm === 'yarn') {
      await spawnAsync(
        'yarn',
        ['add', '-D', '@zosmaai/zosma-qa-playwright', '@playwright/test'],
        projectDir,
      );
    } else {
      await spawnAsync(
        'npm',
        ['install', '-D', '@zosmaai/zosma-qa-playwright', '@playwright/test'],
        projectDir,
      );
    }
    installSpinner.succeed(chalk.green('Installed  @zosmaai/zosma-qa-playwright'));
  } catch {
    installSpinner.warn(
      chalk.yellow(
        `Could not install dependencies automatically. Run manually:\n` +
          `  npm install -D @zosmaai/zosma-qa-playwright @playwright/test`,
      ),
    );
  }

  // ── Run playwright init-agents ─────────────────────────────────────────────

  if (agentLoop !== 'skip') {
    console.log('');
    const agentSpinner = ora(`Running: npx playwright init-agents --loop=${agentLoop}`).start();

    try {
      await spawnAsync('npx', ['playwright', 'init-agents', `--loop=${agentLoop}`], projectDir);
      agentSpinner.succeed(
        chalk.green(`Agent definitions written to .github/agents/  (loop: ${agentLoop})`),
      );
    } catch (_err) {
      agentSpinner.warn(
        chalk.yellow(
          `Could not run playwright init-agents. Run manually:\n` +
            `  npx playwright install && npx playwright init-agents --loop=${agentLoop}`,
        ),
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  const cdHint = projectName.trim() ? `  ${chalk.cyan(`cd ${projectName.trim()}`)}\n` : '';

  console.log('');
  console.log(`${chalk.bold.green('  Ready!')}  Here's what to do next:\n`);
  if (cdHint) console.log(cdHint);
  console.log(`  ${chalk.cyan('npx zosma-qa run')}          run your tests`);
  console.log(
    `  ${chalk.cyan('npx zosma-qa agents init')}  re-run agent setup for a different AI tool`,
  );
  console.log(`  ${chalk.cyan('npx zosma-qa report')}       open the HTML report`);
  console.log('');
  console.log(
    chalk.dim(
      `  Tip: open ${chalk.white('tests/seed.spec.ts')} and prompt your AI agent:\n` +
        `       "Use the planner agent. Seed: tests/seed.spec.ts"\n`,
    ),
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function spawnAsync(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd });
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    child.on('error', reject);
  });
}

function detectPackageManager(cwd: string): 'npm' | 'pnpm' | 'yarn' {
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
