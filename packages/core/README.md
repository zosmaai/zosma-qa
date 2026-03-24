# @zosmaai/zosma-qa-core

Core types, config loader, and plugin interface for [zosma-qa](https://github.com/zosmaai/zosma-qa) — the zero-config QA platform.

This package is the shared foundation for all zosma-qa runner plugins. It has no runtime dependency on Playwright or any specific test runner.

## What's in this package

| Export | Description |
|---|---|
| `defineConfig(overrides)` | Define a `zosma.config.ts` — merges your settings with built-in defaults |
| `loadConfig(cwd)` | Loads `zosma.config.ts` at runtime |
| `findTestFiles(testDir)` | Walks a directory and returns all `*.spec.ts` / `*.test.ts` files |
| `ZosmaPlugin` | Interface every runner plugin must implement |
| `Browser`, `AgentLoop`, `TestResult`, `RunSummary` | Shared TypeScript types |

## Usage

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['playwright'],
  testDir: './tests',
  baseURL: 'https://www.myapp.com',
  browsers: ['chromium'],
});
```

## Plugin interface

If you are building a custom runner plugin:

```typescript
import type { ZosmaPlugin, RunnerConfig, TestResult } from '@zosmaai/zosma-qa-core';

export class MyRunner implements ZosmaPlugin {
  readonly name = 'my-runner';

  async run(config: RunnerConfig): Promise<TestResult[]> {
    // run your tests
  }
}
```

## Part of zosma-qa

- [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) — this package
- [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) — Playwright runner and base config
- [`@zosmaai/zosma-qa-appium`](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) — Appium mobile testing runner
- [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) — interactive CLI (`npx zosma-qa`)

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
