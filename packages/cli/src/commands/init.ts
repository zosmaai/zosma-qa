import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { checkbox, input, select } from '@inquirer/prompts';
import type { AgentLoop, Browser } from '@zosmaai/zosma-qa-core';
import chalk from 'chalk';
import ora from 'ora';

type Language = 'typescript' | 'python';

// ─── TypeScript templates ──────────────────────────────────────────────────────

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

function zosmaConfigTsTemplate(baseURL: string, browsers: Browser[]): string {
  const browsersJson = JSON.stringify(browsers);
  return `import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['playwright'],
  baseURL: '${baseURL}',
  browsers: ${browsersJson},
});
`;
}

// ─── Python templates ──────────────────────────────────────────────────────────

function pyprojectTomlTemplate(projectName: string, baseURL: string, browsers: Browser[]): string {
  const safeName = projectName.trim() || 'my-qa-project';
  const browserOpts = browsers.map((b) => `--browser ${b}`).join(' ');
  return `[project]
name = "${safeName}"
version = "0.1.0"
requires-python = ">=3.9"
dependencies = [
    "pytest-playwright>=0.5.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
base_url = "${baseURL}"
addopts = "${browserOpts}"
`;
}

function confpyTemplate(): string {
  return `# conftest.py
#
# pytest-playwright fixtures are available automatically:
#   page       — a new Playwright Page for each test
#   browser    — the browser instance
#   context    — the browser context
#
# base_url is configured in pyproject.toml under [tool.pytest.ini_options].
# Add your own shared fixtures below.
`;
}

function testSeedPyTemplate(): string {
  return `from playwright.sync_api import Page, expect


def test_seed(page: Page) -> None:
    """
    Seed test — entry point for AI agents.

    How to use with agents:
      # Prompt your AI tool:
      #   "Use the planner agent. Seed: tests/test_seed.py"
    """
    page.goto("/")
    expect(page).not_to_have_title("")
`;
}

function zosmaConfigPyTemplate(baseURL: string, browsers: Browser[]): string {
  const browsersJson = JSON.stringify(browsers);
  return `import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['pytest'],
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

  const language = await select<Language>({
    message: 'Language:',
    choices: [
      {
        name: 'TypeScript  (default)',
        value: 'typescript' as Language,
        description: 'Playwright tests in TypeScript — the most common choice',
      },
      {
        name: 'Python',
        value: 'python' as Language,
        description: 'Playwright tests in Python using pytest-playwright',
      },
    ],
    default: 'typescript',
  });

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

  // AI loop prompt — TypeScript only; the init-agents tooling requires Node.js/Playwright TS
  let agentLoop: AgentLoop | 'skip' = 'skip';
  if (language === 'typescript') {
    agentLoop = await select<AgentLoop | 'skip'>({
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
  }

  console.log('');

  // ── Scaffold files ─────────────────────────────────────────────────────────

  if (language === 'python') {
    const uvAvailable = isUvAvailable();
    await scaffoldPython(projectDir, projectName, baseURL, browsers as Browser[], uvAvailable);
    console.log('');
    console.log(`${chalk.bold.green('  Ready!')}  Here's what to do next:\n`);
    const cdHint = projectName.trim() ? `  ${chalk.cyan(`cd ${projectName.trim()}`)}\n` : '';
    if (cdHint) console.log(cdHint);
    printPythonSummary(uvAvailable);
  } else {
    await scaffoldTypeScript(projectDir, baseURL, browsers as Browser[], agentLoop);
    console.log('');
    console.log(`${chalk.bold.green('  Ready!')}  Here's what to do next:\n`);
    const cdHint = projectName.trim() ? `  ${chalk.cyan(`cd ${projectName.trim()}`)}\n` : '';
    if (cdHint) console.log(cdHint);
    printTypeScriptSummary();
  }
}

// ─── TypeScript scaffold ───────────────────────────────────────────────────────

async function scaffoldTypeScript(
  projectDir: string,
  baseURL: string,
  browsers: Browser[],
  agentLoop: AgentLoop | 'skip',
): Promise<void> {
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
    fs.writeFileSync(pwConfigPath, playwrightConfigTemplate(baseURL, browsers), 'utf8');
    spinner.succeed(chalk.green(`Created  playwright.config.ts`));
  } else {
    spinner.info(chalk.dim(`Skipped  playwright.config.ts  (already exists)`));
    spinner.stop();
  }

  // zosma.config.ts
  const zosmaConfigPath = path.join(projectDir, 'zosma.config.ts');
  if (!fs.existsSync(zosmaConfigPath)) {
    fs.writeFileSync(zosmaConfigPath, zosmaConfigTsTemplate(baseURL, browsers), 'utf8');
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

  const pkgJsonPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    const initSpinner = ora('Creating package.json…').start();
    try {
      await spawnAsync('npm', ['init', '-y'], projectDir);
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
}

// ─── Python scaffold ───────────────────────────────────────────────────────────

async function scaffoldPython(
  projectDir: string,
  projectName: string,
  baseURL: string,
  browsers: Browser[],
  uvAvailable: boolean,
): Promise<void> {
  const spinner = ora();

  // tests/test_seed.py
  const testsDir = path.join(projectDir, 'tests');
  ensureDir(testsDir);
  const seedPath = path.join(testsDir, 'test_seed.py');
  if (!fs.existsSync(seedPath)) {
    fs.writeFileSync(seedPath, testSeedPyTemplate(), 'utf8');
    spinner.succeed(chalk.green(`Created  tests/test_seed.py`));
  } else {
    spinner.info(chalk.dim(`Skipped  tests/test_seed.py  (already exists)`));
    spinner.stop();
  }

  // conftest.py
  const confpyPath = path.join(projectDir, 'conftest.py');
  if (!fs.existsSync(confpyPath)) {
    fs.writeFileSync(confpyPath, confpyTemplate(), 'utf8');
    spinner.succeed(chalk.green(`Created  conftest.py`));
  } else {
    spinner.info(chalk.dim(`Skipped  conftest.py  (already exists)`));
    spinner.stop();
  }

  // pyproject.toml
  const pyprojectPath = path.join(projectDir, 'pyproject.toml');
  if (!fs.existsSync(pyprojectPath)) {
    fs.writeFileSync(pyprojectPath, pyprojectTomlTemplate(projectName, baseURL, browsers), 'utf8');
    spinner.succeed(chalk.green(`Created  pyproject.toml`));
  } else {
    spinner.info(chalk.dim(`Skipped  pyproject.toml  (already exists)`));
    spinner.stop();
  }

  // zosma.config.ts
  const zosmaConfigPath = path.join(projectDir, 'zosma.config.ts');
  if (!fs.existsSync(zosmaConfigPath)) {
    fs.writeFileSync(zosmaConfigPath, zosmaConfigPyTemplate(baseURL, browsers), 'utf8');
    spinner.succeed(chalk.green(`Created  zosma.config.ts`));
  } else {
    spinner.info(chalk.dim(`Skipped  zosma.config.ts  (already exists)`));
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

  // .github/agents/
  const agentsDir = path.join(projectDir, '.github', 'agents');
  ensureDir(path.join(projectDir, '.github'));
  ensureDir(agentsDir);
  const agentsKeep = path.join(agentsDir, '.gitkeep');
  if (!fs.existsSync(agentsKeep)) {
    fs.writeFileSync(agentsKeep, '', 'utf8');
  }

  // ── Install via uv (if available) ─────────────────────────────────────────

  if (uvAvailable) {
    const installSpinner = ora('Installing pytest-playwright via uv…').start();
    try {
      await spawnAsync('uv', ['add', 'pytest-playwright'], projectDir);
      installSpinner.succeed(chalk.green('Installed  pytest-playwright  (via uv)'));
    } catch {
      installSpinner.warn(
        chalk.yellow(
          'Could not install pytest-playwright automatically — see install instructions below.',
        ),
      );
    }
  }

  // init-agents is not yet supported for Python (requires Node.js/Playwright TS tooling)
  console.log('');
  console.log(
    chalk.dim(
      `  Note: AI agent scaffolding (npx playwright init-agents) is not yet supported\n` +
        `        for Python projects. Use tests/test_seed.py as your AI agent entry point.\n`,
    ),
  );
}

// ─── Summaries ────────────────────────────────────────────────────────────────

function printTypeScriptSummary(): void {
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

function printPythonSummary(uvAvailable: boolean): void {
  if (uvAvailable) {
    console.log(`  Download browser binaries:`);
    console.log(`    ${chalk.cyan('playwright install')}\n`);
    console.log(`  Run your tests:`);
    console.log(`    ${chalk.cyan('uv run pytest tests/test_seed.py')}`);
    console.log(`    ${chalk.cyan('npx zosma-qa run')}  (detects uv automatically)\n`);
  } else {
    console.log(`  Install dependencies first:\n`);
    console.log(
      chalk.bold(`  Option A — uv`) + chalk.dim(` (recommended — handles virtualenv for you)`),
    );
    console.log(`    ${chalk.cyan('curl -LsSf https://astral.sh/uv/install.sh | sh')}`);
    console.log(`    ${chalk.cyan('uv sync')}`);
    console.log(`    ${chalk.cyan('playwright install')}`);
    console.log(`    ${chalk.cyan('uv run pytest tests/test_seed.py')}\n`);
    console.log(chalk.bold(`  Option B — venv + pip`));
    console.log(`    ${chalk.cyan('python -m venv .venv')}`);
    console.log(
      `    ${chalk.cyan('source .venv/bin/activate')}` +
        chalk.dim(`   # Windows: .venv\\Scripts\\activate`),
    );
    console.log(`    ${chalk.cyan('pip install pytest-playwright')}`);
    console.log(`    ${chalk.cyan('playwright install')}`);
    console.log(`    ${chalk.cyan('pytest tests/test_seed.py')}\n`);
  }
  console.log(
    chalk.dim(
      `  Tip: open ${chalk.white('tests/test_seed.py')} and prompt your AI agent:\n` +
        `       "Write more tests following the pattern in tests/test_seed.py"\n`,
    ),
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Check whether `uv` is installed on the system.
 * Returns true if `uv --version` exits with code 0.
 */
function isUvAvailable(): boolean {
  try {
    const result = spawnSync('uv', ['--version'], { stdio: 'pipe' });
    return result.status === 0;
  } catch {
    return false;
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
