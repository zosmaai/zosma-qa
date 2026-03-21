# zosma-qa

**Zero-config QA platform — Playwright, AI agents, and extensible test runners.**

Drop your tests in. Everything works.

[![npm](https://img.shields.io/npm/v/zosma-qa)](https://www.npmjs.com/package/zosma-qa)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Quick start

```bash
# Clone and run (recommended)
git clone https://github.com/zosmaai/zosma-qa.git
cd zosma-qa
pnpm install && npx playwright install
npx zosma-qa init
```

Or use the base config in your own project:

```bash
npm install -D @zosmaai/zosma-qa-playwright @playwright/test
```

```typescript
// playwright.config.ts
import { defineConfig } from '@zosmaai/zosma-qa-playwright';

export default defineConfig({
  use: { baseURL: 'https://www.myapp.com' },
  browsers: ['chromium', 'firefox'],
});
```

## CLI commands

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive setup — baseURL, browsers, AI agents |
| `npx zosma-qa run` | Run all tests |
| `npx zosma-qa run --headed` | Run in visible browser mode |
| `npx zosma-qa run --grep "checkout"` | Run matching tests |
| `npx zosma-qa agents init` | Set up Playwright AI agent definitions |
| `npx zosma-qa report` | Open the HTML report |

## AI agents

```bash
npx zosma-qa agents init
# Choose: OpenCode (default) / Claude Code / VS Code (Copilot)
```

Then prompt your AI tool:

```
Use the planner agent. Seed: tests/seed.spec.ts.
Generate a plan for the guest checkout flow.
```

## Packages

| Package | Description |
|---|---|
| [`zosma-qa`](https://www.npmjs.com/package/zosma-qa) | This package — `npx zosma-qa` entry point |
| [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) | Playwright base config |
| [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) | Shared types and plugin interface |
| [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) | Full CLI implementation |

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
