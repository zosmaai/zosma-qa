import fs from 'node:fs';
import path from 'node:path';

/**
 * Discover Appium test files in a directory.
 * Supports patterns: *.appium.ts, *.appium.js, test_*.py, *_test.py
 */

const APPIUM_TEST_PATTERNS = [/\.appium\.ts$/, /\.appium\.js$/, /^test_.+\.py$/, /^.+_test\.py$/];

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '__pycache__',
  '.pytest_cache',
  '.venv',
  'build',
  'ios',
  'android',
]);

/**
 * Find all Appium test files in a directory.
 */
export function findAppiumTests(testDir: string, cwd: string = process.cwd()): string[] {
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
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      results.push(...walk(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      if (APPIUM_TEST_PATTERNS.some((re) => re.test(entry.name))) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}
