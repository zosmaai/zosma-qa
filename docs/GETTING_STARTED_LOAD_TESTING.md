# Getting Started with Load Testing (k6 / Artillery)

> **Status: Planned** — Load testing support is on the zosma-qa roadmap but not yet implemented.

---

## What's Coming

zosma-qa will support load and performance testing through two popular tools:

| Runner | Package | Use Case |
|---|---|---|
| **k6** | `@zosmaai/zosma-qa-k6` | Developer-centric load testing with JavaScript |
| **Artillery** | `@zosmaai/zosma-qa-artillery` | YAML-first load testing with rich scenarios |

Both will follow the same plugin pattern as the Playwright and Appium runners — implement `ZosmaPlugin`, configure in `zosma.config.ts`, run with `npx zosma-qa run`.

---

## Planned Features

### k6 Integration

- Write load tests in JavaScript/TypeScript
- Configure via `zosma.config.ts` with `plugins: ['k6']`
- Run with `npx zosma-qa run` (dispatches to `k6 run`)
- Results aggregated into the unified report dashboard

```typescript
// Example: future k6 test
// tests/load/homepage.k6.ts
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '30s',
};

export default function () {
  const res = http.get('https://www.myapp.com');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Artillery Integration

- YAML-based test scenarios
- Configure via `zosma.config.ts` with `plugins: ['artillery']`
- Run with `npx zosma-qa run` (dispatches to `artillery run`)
- Support for HTTP, WebSocket, and Socket.IO protocols

```yaml
# Example: future Artillery test
# tests/load/homepage.artillery.yml
config:
  target: "https://www.myapp.com"
  phases:
    - duration: 30
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200
```

---

## Roadmap

Load testing is part of **Phase 2** in the [zosma-qa Vision](VISION.md). The implementation order:

1. k6 plugin (JavaScript-native, aligns with TypeScript ecosystem)
2. Artillery plugin (YAML-first, broader protocol support)
3. Unified reporting (load metrics alongside E2E and mobile test results)

---

## Want to Contribute?

If you're interested in building the k6 or Artillery plugin, see:

- [Architecture](ARCHITECTURE.md) — how plugins work
- [CONTRIBUTING.md](../CONTRIBUTING.md) — development setup and guidelines
- The existing [`@zosmaai/zosma-qa-appium`](../packages/appium/) package as a reference for building a new runner plugin

---

## Stay Updated

Watch the [zosma-qa repository](https://github.com/zosmaai/zosma-qa) for updates on load testing support.
