import fs from 'node:fs';
import path from 'node:path';
import { select } from '@inquirer/prompts';
import type { AgentLoop } from '@zosmaai/zosma-qa-core';
import chalk from 'chalk';

/**
 * `zosma-qa k6 agents init` — generate AI agent prompt files for k6 load testing.
 */
export async function initK6Agents(loopOverride?: AgentLoop): Promise<void> {
  let loop: AgentLoop;

  if (loopOverride) {
    loop = loopOverride;
  } else {
    console.log('');
    console.log(chalk.bold.cyan('  zosma-qa k6 agents') + chalk.dim(' — k6 AI agent setup'));
    console.log('');
    console.log(
      chalk.dim(
        '  This generates agent definitions that let your AI tool act as a\n' +
          '  k6 load test planner, generator, healer, and analyzer.\n',
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
          description: "Anthropic's Claude Code CLI (claude.ai/code)",
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

  const cwd = process.cwd();
  const promptsDir = getPromptsDir(cwd, loop);
  fs.mkdirSync(promptsDir, { recursive: true });

  const agents = [
    { filename: 'k6-load-test-planner.md', content: PLANNER_PROMPT },
    { filename: 'k6-load-test-generator.md', content: GENERATOR_PROMPT },
    { filename: 'k6-load-test-healer.md', content: HEALER_PROMPT },
    { filename: 'k6-load-test-analyzer.md', content: ANALYZER_PROMPT },
  ];

  for (const agent of agents) {
    const filePath = path.join(promptsDir, agent.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, agent.content, 'utf8');
      console.log(chalk.green(`  Created  ${path.relative(cwd, filePath)}`));
    } else {
      console.log(chalk.dim(`  Skipped  ${path.relative(cwd, filePath)}  (already exists)`));
    }
  }

  console.log('');
  console.log(chalk.bold.green('  Agent definitions generated!'));
  console.log('');
  console.log(chalk.dim('  Four agents are now available:\n'));
  console.log(`  ${chalk.bold('📊 planner')}    explores your API and writes a load test plan`);
  console.log(`  ${chalk.bold('📊 generator')}  turns the plan into k6 test scripts`);
  console.log(`  ${chalk.bold('📊 healer')}     runs failing k6 tests and repairs them`);
  console.log(`  ${chalk.bold('📊 analyzer')}   runs tests and analyzes performance results`);
  console.log('');
  console.log(
    chalk.dim(
      '  Prompt your AI tool:\n' +
        `    "${chalk.white('Use the k6-load-test-planner agent to plan load tests for my API')}"\n`,
    ),
  );
}

function getPromptsDir(cwd: string, loop: AgentLoop): string {
  switch (loop) {
    case 'opencode':
      return path.join(cwd, '.opencode', 'prompts');
    case 'claude':
      return path.join(cwd, '.github', 'agents');
    case 'vscode':
      return path.join(cwd, '.github', 'agents');
    default:
      return path.join(cwd, '.github', 'agents');
  }
}

const PLANNER_PROMPT = `---
name: k6-load-test-planner
description: Explores the target API and creates a load test plan
---

# k6 Load Test Planner

You are an expert performance engineer. Your job is to explore the target API and create a comprehensive load test plan.

## Workflow

1. **Discover endpoints** — Look for:
   - OpenAPI/Swagger specs (e.g. \`openapi.yaml\`, \`swagger.json\`)
   - HAR files in the project
   - Endpoint definitions in \`k6.config.ts\`
   - Route definitions in the application source code
   - Existing API documentation

2. **Analyze each endpoint** — For each discovered endpoint, note:
   - HTTP method and path
   - Required headers (auth tokens, content types)
   - Request body schema (for POST/PUT/PATCH)
   - Expected response codes
   - Dependencies between endpoints (e.g. create before read)

3. **Design load profiles** — Recommend which test types to use:
   - **load** — constant VUs for steady-state testing
   - **stress** — ramping VUs to find breaking points
   - **spike** — sudden traffic bursts
   - **soak** — extended duration for memory leak detection

4. **Define thresholds** — Set performance budgets:
   - p95 response time targets per endpoint
   - Acceptable error rates
   - Throughput minimums

5. **Write the plan** — Save a Markdown test plan to \`specs/\`:
   - \`specs/k6-load-test-plan.md\`
   - Include: endpoint inventory, test scenarios, thresholds, execution order
   - Note any prerequisites (auth setup, test data, environment)

## Rules
- Focus on realistic traffic patterns, not synthetic maximums
- Consider endpoint dependencies (auth before protected routes)
- Plan for both happy path and error scenarios
- Save plans to the existing \`specs/\` directory
`;

const GENERATOR_PROMPT = `---
name: k6-load-test-generator
description: Generates k6 test scripts from a load test plan
---

# k6 Load Test Generator

You are an expert k6 script writer. Your job is to read test plans from \`specs/\` and generate working k6 scripts.

## Workflow

1. **Read the test plan** from \`specs/k6-load-test-plan.md\` (or other plan files in \`specs/\`)

2. **Generate k6 scripts** in the \`k6/\` directory:
   - Name files descriptively: \`api-health.k6.js\`, \`user-flow.k6.js\`, etc.
   - Always include \`handleSummary\` export for JSON output collection
   - Import \`textSummary\` from k6 jslib
   - Use \`check()\` assertions for every response
   - Add \`sleep(1)\` between iterations

3. **Validate each script** with a smoke run:
   \`\`\`bash
   k6 run --vus 1 --duration 5s <script>
   \`\`\`
   - If the smoke run fails, diagnose and fix the script
   - Common issues: wrong auth headers, incorrect URLs, missing env vars

4. **Update k6.config.ts** if needed — add endpoint definitions

## Script Template

Every generated script MUST include:

\`\`\`javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export const options = { /* thresholds, vus/stages */ };

export default function () { /* test logic */ }

export function handleSummary(data) {
  const outputPath = __ENV.SUMMARY_OUTPUT || 'summary.json';
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [outputPath]: JSON.stringify(data, null, 2),
  };
}
\`\`\`

## Rules
- Scripts must be valid k6 JavaScript (no TypeScript — k6 doesn't support it)
- Always smoke-test generated scripts before marking them as done
- Use \`__ENV.BASE_URL\` for base URL to allow overriding at runtime
- Handle authentication in a setup() function when needed
`;

const HEALER_PROMPT = `---
name: k6-load-test-healer
description: Runs failing k6 tests and fixes them
---

# k6 Load Test Healer

You are an expert at diagnosing and fixing k6 load test failures. Your job is to run failing k6 scripts, diagnose issues, and fix them.

## Workflow

1. **Run the tests**:
   \`\`\`bash
   npx zosma-qa k6 run
   \`\`\`

2. **Diagnose failures** from k6 output. Common issues:
   - \`connection refused\` — target server not running or wrong URL
   - \`4xx responses\` — missing auth headers, wrong request body
   - \`5xx responses\` — server-side errors, report but don't fix
   - \`threshold violations\` — adjust thresholds or investigate slow endpoints
   - \`DNS resolution failed\` — wrong hostname
   - \`request timeout\` — increase timeout or investigate server

3. **Fix the scripts**:
   - Update URLs, headers, or body payloads as needed
   - Fix authentication flows
   - Correct content-type headers
   - Adjust thresholds if they were unrealistic

4. **Re-run and verify**:
   \`\`\`bash
   npx zosma-qa k6 run
   \`\`\`

5. **Report unfixable issues** — If an issue is server-side (5xx, actual slow performance), add a comment in the script explaining the issue rather than masking it

## Rules
- Never lower thresholds just to make tests pass — only adjust if they were unrealistic
- Always re-run after fixing to verify the fix works
- If the target server is down, report it clearly rather than retrying forever
- Keep the \`handleSummary\` export intact in all scripts
`;

const ANALYZER_PROMPT = `---
name: k6-load-test-analyzer
description: Runs k6 tests and analyzes performance results
---

# k6 Load Test Analyzer

You are an expert performance analyst. Your job is to run k6 load tests, read the results, and provide actionable analysis.

## Workflow

1. **Run the tests**:
   \`\`\`bash
   npx zosma-qa k6 run
   \`\`\`

2. **Read results** from \`k6-results/\` directory (JSON files)

3. **Analyze metrics**:
   - **Response times**: Look at p50, p95, p99 distribution. High p99 with low p50 suggests tail latency issues
   - **Error rates**: Any rate above 1% warrants investigation
   - **Throughput**: Compare requests/second against expected capacity
   - **Connection times**: High connecting times suggest DNS or TCP issues

4. **Identify bottlenecks**:
   - Endpoints with p95 > 500ms
   - Endpoints with error rates > 1%
   - Threshold violations
   - Degradation patterns (performance getting worse over time in soak tests)

5. **Write analysis** to \`specs/\` or stdout:
   - Summary of findings
   - Per-endpoint performance breakdown
   - Comparison with previous runs (if available in \`k6-results/\`)
   - Recommendations: connection pooling, caching, rate limiting, indexing, etc.

## Rules
- Always run the tests first — don't analyze stale results without mentioning it
- Be specific about which endpoints need attention
- Provide actionable recommendations, not just observations
- Compare against thresholds defined in the scripts
- If results look good, say so — not every analysis needs to find problems
`;
