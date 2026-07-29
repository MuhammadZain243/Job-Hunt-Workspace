# Job Hunt Workspace

Private single-owner application for managing a personal job-search workflow.

## Status

**Phase 0 (Foundation)** is implemented in this repository.

## Stack

- Next.js App Router (`src/`) with TypeScript strict mode
- MongoDB (native driver for Better Auth, Mongoose for domain models)
- Better Auth email/password (no public registration)
- AES-256-GCM credential encryption service
- Tailwind CSS + shadcn/ui
- Vitest + Playwright
- Profile-based MCP tooling

## Prerequisites

- Node.js 22+
- pnpm 10+
- Local MongoDB or MongoDB Atlas

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Edit `.env.local` and set:

- `MONGODB_URI` / `MONGODB_DB_NAME`
- `BETTER_AUTH_SECRET` (32+ characters)
- `APP_ENCRYPTION_MASTER_KEY` (base64 of exactly 32 random bytes)

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Owner bootstrap

Public signup is disabled. Create the first (and only) owner account:

```bash
pnpm bootstrap:owner -- --email "you@example.com" --password "at-least-12-chars" --name "Your Name"
```

Then ensure indexes:

```bash
pnpm db:ensure-indexes
```

## Run

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to `/login`.

## Quality commands

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

## Project layout

```text
src/
  app/             # App Router pages and route handlers
  components/      # UI and layout
  config/          # Navigation and shared config
  hooks/
  lib/             # Auth, DB, encryption, env, errors, logger
  modules/         # Domain modules (audit, settings foundation)
  types/
scripts/           # Bootstrap and maintenance scripts
tests/             # Unit and e2e tests
```

## MCP

Use a private local MCP config in your editor. Do not commit MCP credentials or local agent configuration.

## Secret policy

`.env` / `.env.local` are for platform bootstrap only. Owner Gmail, LinkedIn, OpenAI, and Cloudinary credentials must be configured later through the Settings UI and stored encrypted in MongoDB.

## Notes

This repository keeps the runnable application code, scripts, and tests. Local agent planning/reference files may exist in your workspace but are intentionally gitignored.
