import { Command } from 'commander';
import { initAgents } from './commands/agents';
import { runInit } from './commands/init';
import { initK6, runK6 } from './commands/k6';
import { initK6Agents } from './commands/k6-agents';
import { openReport } from './commands/report';
import { runTests } from './commands/run';

const program = new Command();

program
  .name('zosma-qa')
  .description('Zero-config QA platform — Playwright, AI agents, and more')
  .version('0.1.0');

// ─── init ─────────────────────────────────────────────────────────────────────

program
  .command('init')
  .description('Scaffold tests/, specs/, playwright.config.ts and set up AI agents')
  .action(async () => {
    await runInit();
  });

// ─── run ──────────────────────────────────────────────────────────────────────

program
  .command('run')
  .description('Run all Playwright tests (delegates to npx playwright test)')
  .option('-p, --project <name>', 'Run a specific Playwright project (browser)')
  .option('-g, --grep <pattern>', 'Only run tests matching this pattern')
  .option('--headed', 'Run tests in headed (visible) browser mode')
  .option('--debug', 'Run tests in Playwright debug mode')
  .option('-w, --workers <n>', 'Number of parallel workers')
  .option('--shard <shard>', 'Shard tests (e.g. 1/3)')
  .option('--reporter <reporter>', 'Override reporter (e.g. list, dot, html)')
  .action(async (options) => {
    await runTests(options);
  });

// ─── agents ───────────────────────────────────────────────────────────────────

const agentsCmd = program.command('agents').description('Manage Playwright AI agent definitions');

agentsCmd
  .command('init')
  .description('Generate Playwright AI agent definitions for your AI coding tool')
  .option('--loop <loop>', 'AI loop to use: opencode | claude | vscode')
  .action(async (options) => {
    await initAgents(options.loop);
  });

// ─── k6 ──────────────────────────────────────────────────────────────────────

const k6Cmd = program.command('k6').description('Manage k6 load tests');

k6Cmd
  .command('run')
  .description('Run k6 load tests')
  .option('--type <type>', 'Test type: load | stress | spike | soak')
  .option('--vus <n>', 'Number of virtual users')
  .option('--duration <duration>', 'Test duration (e.g. 30s, 5m)')
  .option('--script <path>', 'Run a specific k6 script')
  .option('--base-url <url>', 'Override base URL')
  .action(async (options) => {
    await runK6(options);
  });

k6Cmd
  .command('init')
  .description('Scaffold k6 test structure with example script and config')
  .action(async () => {
    await initK6();
  });

const k6AgentsCmd = k6Cmd.command('agents').description('Manage k6 AI agent definitions');

k6AgentsCmd
  .command('init')
  .description('Generate k6 AI agent definitions for your AI coding tool')
  .option('--loop <loop>', 'AI loop to use: opencode | claude | vscode')
  .action(async (options) => {
    await initK6Agents(options.loop);
  });

// ─── report ───────────────────────────────────────────────────────────────────

program
  .command('report')
  .description('Open the latest Playwright HTML report in the browser')
  .action(async () => {
    await openReport();
  });

// ─── fallback ─────────────────────────────────────────────────────────────────

program.parse(process.argv);
