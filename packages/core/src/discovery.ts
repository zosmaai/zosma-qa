import fs from 'node:fs';
import path from 'node:path';

const TEST_FILE_PATTERNS = [/\.spec\.ts$/, /\.test\.ts$/, /\.spec\.js$/, /\.test\.js$/];

/**
 * Recursively walk a directory and return all test files matching
 * standard patterns (*.spec.ts, *.test.ts, *.spec.js, *.test.js).
 *
 * Respects the same ignore list as Playwright (node_modules, dist, .git).
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
      if (
        [
          'node_modules',
          'dist',
          '.git',
          '.playwright',
          'playwright-report',
          'test-results',
        ].includes(entry.name)
      ) {
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
