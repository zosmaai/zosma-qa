import fs from 'node:fs';
import path from 'node:path';
import type { RunnerConfig, TestResult, ZosmaPlugin } from '@zosmaai/zosma-qa-core';
import { loadK6Config } from './config';
import { findK6Scripts } from './discovery';
import { executeK6 } from './executor';
import { parseK6Summary, toTestResults } from './parser';
import { generateScript } from './templates/index';

/**
 * k6 load testing plugin.
 * Delegates to the k6 CLI under the hood — a clean wrapper with no AI/LLM logic.
 */
export class K6Runner implements ZosmaPlugin {
  readonly name = 'k6';

  async run(config: RunnerConfig): Promise<TestResult[]> {
    const cwd = process.cwd();
    const k6Config = await loadK6Config(cwd);

    // Apply CLI overrides
    if (config.baseURL) {
      k6Config.baseURL = config.baseURL;
    }

    // Discover existing k6 scripts
    let scripts = findK6Scripts(k6Config.testDir, cwd);

    // If no scripts found but endpoints configured, generate from template
    if (scripts.length === 0 && k6Config.endpoints && k6Config.endpoints.length > 0) {
      const testDir = path.isAbsolute(k6Config.testDir)
        ? k6Config.testDir
        : path.join(cwd, k6Config.testDir);

      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }

      const scriptContent = generateScript(k6Config);
      const generatedPath = path.join(testDir, `generated-${k6Config.testType}.k6.js`);
      fs.writeFileSync(generatedPath, scriptContent, 'utf8');
      scripts = [generatedPath];
    }

    if (scripts.length === 0) {
      return [
        {
          name: 'k6 suite',
          status: 'skipped',
          duration: 0,
          error: `No k6 scripts found in ${k6Config.testDir}. Run 'npx zosma-qa k6 init' to get started.`,
        },
      ];
    }

    // Ensure output directory exists
    const outputDir = path.isAbsolute(k6Config.outputDir)
      ? k6Config.outputDir
      : path.join(cwd, k6Config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Execute each script and collect results
    const allResults: TestResult[] = [];

    for (const scriptPath of scripts) {
      const scriptName = path.relative(cwd, scriptPath);
      const startTime = Date.now();

      const execResult = await executeK6(scriptPath, k6Config);
      const wallClockMs = Date.now() - startTime;

      if (execResult.error && Object.keys(execResult.summary).length === 0) {
        allResults.push({
          name: scriptName,
          status: 'failed',
          duration: wallClockMs,
          error: execResult.error,
        });
        continue;
      }

      const metrics = parseK6Summary(execResult.summary);
      const results = toTestResults(scriptName, metrics, execResult.exitCode, wallClockMs);
      allResults.push(...results);

      // Save raw results to output directory
      const resultFileName = `${path.basename(scriptPath, '.k6.js')}.json`;
      const resultPath = path.join(outputDir, resultFileName);
      fs.writeFileSync(resultPath, JSON.stringify(execResult.summary, null, 2), 'utf8');
    }

    return allResults;
  }

  async report(_results: TestResult[]): Promise<void> {
    const cwd = process.cwd();
    const k6Config = await loadK6Config(cwd);
    const outputDir = path.isAbsolute(k6Config.outputDir)
      ? k6Config.outputDir
      : path.join(cwd, k6Config.outputDir);

    if (!fs.existsSync(outputDir)) {
      console.log('No k6 results found. Run tests first with: npx zosma-qa k6 run');
      return;
    }

    const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.json'));
    if (files.length === 0) {
      console.log('No k6 result files found in', outputDir);
      return;
    }

    for (const file of files) {
      const raw = fs.readFileSync(path.join(outputDir, file), 'utf8');
      const summary = JSON.parse(raw);
      const metrics = parseK6Summary(summary);

      console.log(`\n--- ${file} ---`);
      console.log(
        `  Duration  p95: ${metrics.duration.p95.toFixed(2)}ms  avg: ${metrics.duration.avg.toFixed(2)}ms`,
      );
      console.log(
        `  Requests: ${metrics.totalRequests} total, ${metrics.requestsPerSecond.toFixed(2)} req/s`,
      );
      console.log(`  Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
      console.log(`  VUs: ${metrics.maxVus} max`);
      console.log(`  Thresholds: ${metrics.thresholdsPassed ? 'PASSED' : 'FAILED'}`);

      if (!metrics.thresholdsPassed) {
        const failed = Object.entries(metrics.thresholdDetails)
          .filter(([, ok]) => !ok)
          .map(([name]) => name);
        console.log(`  Failed: ${failed.join(', ')}`);
      }
    }
  }
}
