# Vision

## What zosma-qa Wants to Be

> **The open-source QA operating system** — a single platform where any QA
> engineer can adopt any testing discipline with zero setup, AI assistance, and
> a unified view of quality across the entire stack.

---

## The Problem We're Solving

QA tooling today is fragmented. Teams use Playwright for browser tests, k6 or
Artillery for load tests, Supertest or Pactum for API tests, axe-core for
accessibility, and a dozen other tools — each with its own config, its own CI
integration, and its own report format. Stitching these together is a solved
problem that every team re-solves from scratch.

zosma-qa aims to be the last QA bootstrap you ever write.

---

## Phase 1 — Playwright Foundation (now)

- Zero-config Playwright setup with best-practice defaults
- First-class AI agent support (planner, generator, healer via `playwright init-agents`)
- Interactive CLI: `init`, `run`, `agents`, `report`
- Monorepo structure with publishable packages
- Docker support and GitHub Actions CI out of the box

---

## Phase 2 — Multi-Runner Support

The plugin interface in `@zosmaai/zosma-qa-core` makes adding new runners straightforward.
Planned plugins:

| Plugin | Test type | Underlying tool |
|---|---|---|
| `@zosmaai/zosma-qa-rest` | REST API testing | Supertest / Pactum |
| `@zosmaai/zosma-qa-k6` | Load testing | k6 |
| `@zosmaai/zosma-qa-artillery` | Load testing | Artillery |
| `@zosmaai/zosma-qa-accessibility` | Accessibility | axe-core + Playwright |
| `@zosmaai/zosma-qa-contract` | Contract testing | Pact |
| `@zosmaai/zosma-qa-visual` | Visual regression | Percy / Chromatic |

Each plugin follows the same pattern: implement `ZosmaPlugin`, add a config
file, and wire it into `zosma.config.ts`. Users run everything with a single
`npx zosma-qa run`.

---

## Phase 3 — Unified Report Dashboard

A single HTML dashboard that aggregates results from all runners:

- Browser test results (pass/fail by test + by browser)
- API test results (endpoint coverage, status codes)
- Load test metrics (p95 latency, RPS, error rates)
- Accessibility violations by page
- Visual diff summary

---

## Phase 4 — Advanced Agent Layer

Beyond Playwright's built-in agents, zosma-qa will offer a pluggable agent
interface that lets teams bring their own:

```typescript
interface ZosmaAgent {
  name: string;
  loop: AgentLoop | string;
  plan(prompt: string, seed: string): Promise<TestPlan>;
  generate(plan: TestPlan): Promise<TestFile[]>;
  heal(failingTest: TestFile): Promise<TestFile>;
}
```

This enables:

- **pi-coding-agent** or any custom agent as the AI backbone
- Teams can train agents on their own codebase conventions
- Swappable LLM providers (OpenAI, Anthropic, local models)
- Agentic test maintenance loops that run automatically on CI failures

---

## Phase 5 — Test Intelligence

- **Flakiness tracking** — detect and quarantine flaky tests automatically
- **Test tagging** — `@smoke`, `@regression`, `@nightly` with CLI filtering
- **Change-aware testing** — only run tests related to the diff (via git analysis)
- **Cross-run trend analysis** — track pass rates, durations, and failure patterns
  over time

---

## Community Goals

zosma-qa is built in the open under Apache 2.0.

- **Plugin registry** — community-published runners for any test framework
- **Template library** — pre-built test suites for common SaaS patterns
  (auth flows, CRUD, checkout, onboarding)
- **Shared fixtures** — reusable fixture library for authentication, mock servers,
  database seeding

---

## Design Principles

1. **Zero config is the default.** Every setting should have a sensible default.
   Users configure what they need to, not what they don't.

2. **No lock-in.** Every command the CLI runs is a standard tool you can invoke
   directly. The framework is a layer of good defaults, not a cage.

3. **AI-native, not AI-dependent.** The platform works perfectly without AI.
   The agents are an accelerator, not a requirement.

4. **Test code is first-class source code.** Generated tests are clean,
   readable TypeScript. They live in version control and are owned by the team.

5. **One repo, any stack.** As new runners are added, the same `zosma-qa run`
   command covers the full quality surface of any product.
