# @zosmaai/zosma-qa-cli

Interactive CLI for [zosma-qa](https://github.com/zosmaai/zosma-qa) — the zero-config QA platform.

```bash
npx zosma-qa init
```

## Commands

| Command | Description |
|---|---|
| `npx zosma-qa init` | Interactive setup — configures baseURL, browsers, and AI agents |
| `npx zosma-qa run` | Run all tests (delegates to Playwright, all flags forwarded) |
| `npx zosma-qa run --project firefox` | Run tests in a specific browser |
| `npx zosma-qa run --grep "checkout"` | Run tests matching a pattern |
| `npx zosma-qa run --headed` | Run in headed (visible) browser mode |
| `npx zosma-qa agents init` | Set up Playwright AI agent definitions |
| `npx zosma-qa report` | Open the HTML test report |

## Quick start

```bash
# Clone the repo
git clone https://github.com/zosmaai/zosma-qa.git
cd zosma-qa
pnpm install
npx playwright install

# Interactive setup
npx zosma-qa init

# Add your tests to tests/, then run
npx zosma-qa run
```

## AI agents

`zosma-qa agents init` sets up Playwright's built-in **planner**, **generator**, and **healer** agents for your AI coding tool:

```bash
npx zosma-qa agents init
# Prompts: OpenCode (default) / Claude Code / VS Code (Copilot)
```

Once configured, prompt your AI tool:

```
Use the planner agent. Seed: tests/seed.spec.ts.
Generate a plan for the guest checkout flow.
```

## Part of zosma-qa

- [`@zosmaai/zosma-qa-core`](https://www.npmjs.com/package/@zosmaai/zosma-qa-core) — shared types and plugin interface
- [`@zosmaai/zosma-qa-playwright`](https://www.npmjs.com/package/@zosmaai/zosma-qa-playwright) — Playwright runner and base config
- [`@zosmaai/zosma-qa-appium`](https://www.npmjs.com/package/@zosmaai/zosma-qa-appium) — Appium mobile testing runner
- [`@zosmaai/zosma-qa-cli`](https://www.npmjs.com/package/@zosmaai/zosma-qa-cli) — this package

Full documentation: [github.com/zosmaai/zosma-qa](https://github.com/zosmaai/zosma-qa)

## License

Apache-2.0
