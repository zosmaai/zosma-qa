import fs from 'node:fs';
import path from 'node:path';

const TEST_FILE_PATTERNS = [
  // TypeScript / JavaScript (Playwright)
  /\.spec\.ts$/,
  /\.test\.ts$/,
  /\.spec\.js$/,
  /\.test\.js$/,
  // Python (pytest-playwright)
  /^test_.+\.py$/,
  /^.+_test\.py$/,
];

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.playwright',
  'playwright-report',
  'test-results',
  // Python
  '__pycache__',
  '.pytest_cache',
  '.venv',
]);

/**
 * Recursively walk a directory and return all test files matching
 * standard patterns:
 *   TypeScript/JS — *.spec.ts, *.test.ts, *.spec.js, *.test.js
 *   Python        — test_*.py, *_test.py
 */
export function findTestFiles(testDir: string, cwd: string = process.cwd()): string[] {
  const resolvedDir = path.isAbsolute(testDir) ? testDir : path.join(cwd, testDir);

  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  return walk(resolvedDir);
}

function walk(dir: string): string[] {
  const results: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    // Skip ignored directories
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      results.push(...walk(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      if (TEST_FILE_PATTERNS.some((re) => re.test(entry.name))) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}
