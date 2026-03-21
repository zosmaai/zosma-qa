# syntax=docker/dockerfile:1

# ─── Base image ──────────────────────────────────────────────────────────────
# The official Playwright image ships with all browsers and system dependencies
# pre-installed. Pin the version to match @playwright/test in package.json.
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS base

WORKDIR /app

# ─── Install pnpm ────────────────────────────────────────────────────────────
RUN npm install -g pnpm@9

# ─── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY packages/core/package.json ./packages/core/
COPY packages/playwright/package.json ./packages/playwright/
COPY packages/cli/package.json ./packages/cli/
COPY examples/zosma-ai/package.json ./examples/zosma-ai/

RUN pnpm install --frozen-lockfile

# ─── Build packages ──────────────────────────────────────────────────────────
FROM deps AS builder

COPY packages/ ./packages/
RUN pnpm build

# ─── Test runner ─────────────────────────────────────────────────────────────
FROM builder AS runner

# Copy the full repo (test files, configs, etc.)
COPY . .

# Default command: run all tests from the repo root
CMD ["pnpm", "test"]
