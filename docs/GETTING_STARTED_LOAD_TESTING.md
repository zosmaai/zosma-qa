# Getting Started with Load Testing

## k6

zosma-qa supports load and performance testing via [k6](https://k6.io/) through the `@zosmaai/zosma-qa-k6` package.

### Prerequisites

- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) installed on your machine
- A zosma-qa project (or run `npx zosma-qa init`)

### Installation

```bash
npm install -D @zosmaai/zosma-qa-k6
```

### Configuration

Add `k6` to your plugins in `zosma.config.ts`:

```typescript
// zosma.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-core';

export default defineConfig({
  plugins: ['k6'],
  testDir: './k6',
  baseURL: 'http://localhost:3000',
});
```

Optionally create a `k6.config.ts` for k6-specific settings:

```typescript
// k6.config.ts
import { defineK6Config } from '@zosmaai/zosma-qa-k6';

export default defineK6Config({
  baseURL: 'http://localhost:3000',
  vus: 50,
  duration: '2m',
  testType: 'stress',
  thresholds: [
    { metric: 'http_req_duration', condition: 'p(95)<500' },
    { metric: 'http_req_failed', condition: 'rate<0.01' },
  ],
});
```

If you skip `k6.config.ts`, sensible defaults are applied (10 VUs, 30s duration, p95<500ms threshold).

### Writing tests

Create k6 scripts in your `testDir` with the `.k6.js` extension:

```javascript
// k6/smoke.k6.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

The runner auto-discovers all `*.k6.js` files in `testDir`.

### Auto-generated scripts

If no scripts exist but you have `endpoints` configured in `k6.config.ts`, the runner generates scripts automatically:

```typescript
defineK6Config({
  baseURL: 'http://localhost:3000',
  testType: 'load',
  endpoints: [
    { method: 'GET', path: '/api/users' },
    { method: 'POST', path: '/api/orders', body: { item: 'widget' } },
  ],
});
```

### Test types

| Type | Description |
|---|---|
| `load` | Constant VU load for a fixed duration (default) |
| `stress` | Gradual ramp-up to find the breaking point |
| `spike` | Sudden burst of traffic |
| `soak` | Long-running stability test |

Custom ramping stages override the test type preset:

```typescript
defineK6Config({
  stages: [
    { duration: '1m', target: 20 },
    { duration: '3m', target: 20 },
    { duration: '1m', target: 0 },
  ],
});
```

### Running

```bash
npx zosma-qa run
```

Results are saved to `./k6-results/` as JSON summaries. Failed thresholds cause a non-zero exit code.

### Multi-plugin

k6 works alongside other runners. For example, run E2E tests and load tests in sequence:

```typescript
export default defineConfig({
  plugins: ['playwright', 'k6'],
});
```

---

## Artillery — Planned

Artillery support is on the roadmap. See [Vision & Roadmap](VISION.md) for details.

---

## Reference

- [k6 documentation](https://grafana.com/docs/k6/latest/)
- [`@zosmaai/zosma-qa-k6` README](../packages/k6/README.md)
- [Architecture](ARCHITECTURE.md)
