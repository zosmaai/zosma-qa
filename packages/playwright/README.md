# @zosmaai/zosma-qa-playwright

Playwright runner and base config for [zosma-qa](https://github.com/zosmaai/zosma-qa) — the zero-config QA platform.

This package exports a `defineConfig()` function that wraps Playwright's config with production-ready defaults, so you get retries, traces, screenshots, video, and HTML reports without writing any boilerplate.

## Installation

```bash
npm install -D @zosmaai/zosma-qa-playwright @playwright/test
npx playwright install
```

## Usage

```typescript
// playwright.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: {
    baseURL: 'https://www.myapp.com',
  },
  browsers: ['chromium', 'firefox', 'webkit'],
});
```

That's it. The following defaults are applied automatically:

| Setting | CI | Local |
|---|---|---|
| `fullyParallel` | `true` | `true` |
| `retries` | `2` | `0` |
| `workers` | `1` | auto |
| `reporter` | html + github + list | html + list |
| `trace` | on-first-retry | on-first-retry |
| `screenshot` | only-on-failure | only-on-failure |
| `video` | retain-on-failure | retain-on-failure |

## Browser shorthand

The `browsers` option maps to Playwright's `devices` presets:

```typescript
browsers: ['chromium']          // Desktop Chrome
browsers: ['chromium', 'firefox', 'webkit']  // full cross-browser
```

## All Playwright options still work

`defineConfig()` returns a standard `PlaywrightTestConfig` — you can override anything:

```typescript
export default defineConfig({
  use: { baseURL: 'https://staging.myapp.com' },
  browsers: ['chromium'],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  testDir: './e2e',
});
```

## Part of zosma-qa

- [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) — shared types and plugin interface
- [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) — this package
- [`@zosmaai/zosma-qa-appium`](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) — Appium mobile testing runner
- [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) — interactive CLI (`npx zosma-qa`)

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
