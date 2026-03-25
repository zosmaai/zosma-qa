import fs from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', 'k6-results']);

/**
 * Recursively find k6 test scripts (*.k6.js) in the given directory.
 */
export function findK6Scripts(testDir: string, cwd: string = process.cwd()): string[] {
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
      if (entry.name.endsWith('.k6.js')) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  return results;
}
