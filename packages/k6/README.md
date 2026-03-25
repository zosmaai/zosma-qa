# @zosmaai/zosma-qa-k6

k6 load testing runner for [zosma-qa](https://github.com/zosmaai/zosma-qa) — the zero-config QA platform.

This package wraps the k6 CLI with auto-discovery, script generation, result parsing, and sensible defaults so you can run load tests with zero boilerplate.

## Installation

```bash
npm install -D @zosmaai/zosma-qa-k6
```

k6 must be installed separately — see [k6 installation docs](https://grafana.com/docs/k6/latest/set-up/install-k6/).

## Usage

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['k6'],
  testDir: './k6',
  baseURL: 'http://localhost:3000',
});
```

```typescript
// k6.config.ts (optional — defaults are applied automatically)
import { defineK6Config } from '@zosmaai/zosma-qa-k6';

export default defineK6Config({
  baseURL: 'http://localhost:3000',
  vus: 50,
  duration: '2m',
  testType: 'stress',
});
```

```bash
npx zosma-qa run
```

## Test types

| Type | Description |
|---|---|
| `load` | Constant VU load for a fixed duration (default) |
| `stress` | Gradual ramp-up to find the breaking point |
| `spike` | Sudden burst of traffic |
| `soak` | Long-running stability test |

## Smart defaults

| Setting | Default |
|---|---|
| `vus` | `10` |
| `duration` | `30s` |
| `testDir` | `./k6` |
| `testMatch` | `*.k6.js` |
| `outputDir` | `./k6-results` |
| `thresholds` | p(95)<500ms, error rate<1% |
| `timeoutSeconds` | `300` |

## Script discovery

The runner recursively finds all `*.k6.js` files in `testDir` (ignoring `node_modules`, `dist`, `.git`, `k6-results`). Each script is executed as an independent k6 run.

## Script generation

If no scripts exist but `endpoints` are configured, the runner auto-generates k6 scripts from templates:

```typescript
defineK6Config({
  baseURL: 'http://localhost:3000',
  endpoints: [
    { method: 'GET', path: '/api/users' },
    { method: 'POST', path: '/api/orders', body: { item: 'widget' } },
  ],
});
```

## All k6 options still work

You can always write raw `.k6.js` scripts with full k6 API access — the runner discovers and executes them as-is:

```javascript
// k6/checkout.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 100, duration: '5m' };

export default function () {
  const res = http.get('https://www.myapp.com/api/checkout');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

## Part of zosma-qa

- [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) — shared types and plugin interface
- [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) — Playwright web testing runner
- [`@zosmaai/zosma-qa-appium`](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) — Appium mobile testing runner
- [`@zosmaai/zosma-qa-k6`](https://www.npmjs.com/package/@zosmaai/zosma-qa-k6) — this package
- [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) — interactive CLI (`npx zosma-qa`)

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
