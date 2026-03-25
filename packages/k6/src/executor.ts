import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { K6Config, K6ExecutionResult } from './types';

/**
 * Execute a k6 script and collect the summary JSON output.
 */
export async function executeK6(scriptPath: string, config: K6Config): Promise<K6ExecutionResult> {
  const summaryPath = path.join(
    os.tmpdir(),
    `k6-summary-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
  );

  const env: Record<string, string> = {
    ...(process.env as Record<string, string>),
    SUMMARY_OUTPUT: summaryPath,
  };

  try {
    const { exitCode, output } = await spawnK6(
      config.k6BinaryPath,
      scriptPath,
      env,
      config.timeoutSeconds,
    );

    // Read and clean up summary JSON
    let summary: Record<string, unknown> = {};
    try {
      if (fs.existsSync(summaryPath)) {
        const raw = fs.readFileSync(summaryPath, 'utf8');
        summary = JSON.parse(raw);
        fs.unlinkSync(summaryPath);
      }
    } catch {
      // summary parse failed — leave empty
    }

    let error = '';
    if (exitCode !== 0 && Object.keys(summary).length === 0) {
      error = `k6 exited with code ${exitCode}:\n${output.slice(0, 1000)}`;
    } else if (Object.keys(summary).length === 0 && exitCode === 0) {
      error = `k6 ran but no summary.json found. k6 output:\n${output.slice(0, 1000)}`;
    }

    return { exitCode, summary, output, error };
  } catch (err) {
    // Clean up temp file on error
    try {
      if (fs.existsSync(summaryPath)) fs.unlinkSync(summaryPath);
    } catch {
      /* ignore */
    }

    if (err instanceof K6NotFoundError) {
      return {
        exitCode: 1,
        summary: {},
        output: '',
        error: `k6 binary not found at '${config.k6BinaryPath}'. Install k6: https://k6.io/docs/get-started/installation/`,
      };
    }
    if (err instanceof K6TimeoutError) {
      return {
        exitCode: 1,
        summary: {},
        output: '',
        error: `k6 timed out after ${config.timeoutSeconds}s`,
      };
    }
    throw err;
  }
}

class K6NotFoundError extends Error {}
class K6TimeoutError extends Error {}

function spawnK6(
  binary: string,
  scriptPath: string,
  env: Record<string, string>,
  timeoutSeconds: number,
): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve, reject) => {
    let output = '';
    let child: ReturnType<typeof spawn>;

    try {
      child = spawn(binary, ['run', scriptPath], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: path.dirname(scriptPath),
        env,
      });
    } catch {
      reject(new K6NotFoundError());
      return;
    }

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new K6TimeoutError());
    }, timeoutSeconds * 1000);

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, output });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new K6NotFoundError());
      } else {
        reject(err);
      }
    });
  });
}
