import { spawn } from 'node:child_process';
import type { RunnerConfig, RunSummary, TestResult, ZosmaPlugin } from '@zosmaai/zosma-qa-core';

/**
 * Playwright test runner plugin.
 * Delegates to the `@playwright/test` CLI under the hood so all
 * Playwright features (sharding, projects, trace viewer …) work unchanged.
 */
export class PlaywrightRunner implements ZosmaPlugin {
  readonly name = 'playwright';

  async run(config: RunnerConfig): Promise<TestResult[]> {
    const args = this.buildArgs(config);
    const exitCode = await this.exec(args, config);

    // Playwright writes its own reporters; we return a minimal summary.
    // Full results are available in the HTML report.
    if (exitCode !== 0) {
      return [
        {
          name: 'playwright suite',
          status: 'failed',
          duration: 0,
          error: `Playwright exited with code ${exitCode}`,
        },
      ];
    }

    return [
      {
        name: 'playwright suite',
        status: 'passed',
        duration: 0,
      },
    ];
  }

  async report(_results: TestResult[]): Promise<void> {
    await this.exec(['show-report'], { testDir: '.', browsers: [], reporters: [], ci: false });
  }

  // ─── helpers ──────────────────────────────────────────────────────────────

  private buildArgs(config: RunnerConfig): string[] {
    const args = ['test'];

    // Forward extra args (e.g. --project, --grep, --shard)
    if (config.extraArgs?.length) {
      args.push(...config.extraArgs);
    }

    return args;
  }

  private exec(args: string[], _config: Partial<RunnerConfig>): Promise<number> {
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
}

// ─── Convenience summary helper ───────────────────────────────────────────────

export function summarise(results: TestResult[]): RunSummary {
  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const duration = results.reduce((acc, r) => acc + r.duration, 0);

  return { total: results.length, passed, failed, skipped, duration, results };
}
