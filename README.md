# Excipient Screen

Single-page decision-support app for formulation scientists. Next.js (App Router) + TypeScript + Tailwind CSS. Phase 1 is front end only, against mock data.

## Setup

Uses **pnpm** through corepack (the version is pinned in `package.json`). If `pnpm` isn't on your PATH, run `corepack enable pnpm`. On Windows without admin rights, install the shims into a folder you own that is on your PATH, e.g. `corepack enable pnpm --install-directory "%APPDATA%
pm"`.

```bash
cp .env.example .env.local        # USE_MOCKS=true
pnpm install
pnpm exec playwright install chromium   # once, for e2e tests
pnpm dev                           # http://localhost:3000
```

## Scripts

| Script                              | What it does                                                                |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server                                                                  |
| `pnpm build`                        | Production build                                                            |
| `pnpm typecheck`                    | `next typegen` + `tsc --noEmit`                                             |
| `pnpm lint`                         | ESLint (Next + TypeScript + jsx-a11y)                                       |
| `pnpm format` / `pnpm format:check` | Prettier                                                                    |
| `pnpm test`                         | Unit and component tests (Vitest + Testing Library)                         |
| `pnpm test:e2e`                     | End-to-end tests (Playwright, reuses or starts the dev server on port 3000) |

## Environment

| Variable    | Default | Notes                                                               |
| ----------- | ------- | ------------------------------------------------------------------- |
| `USE_MOCKS` | `true`  | Server-only. Read only by `lib/data/`. Phase 1 supports only mocks. |

## Working on it

Builds are done one spec at a time with the `/feature` workflow in Claude Code. Specs are in `context/features/`, reference images in `context/screenshots/`, and the active build is tracked in `context/current-feature.md`.
