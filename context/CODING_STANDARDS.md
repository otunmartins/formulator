# Coding standards

These apply to every build. Where a build spec is more specific, the spec wins; where this file conflicts with a product rule in `CLAUDE.md`, the product rule wins.

## 1. Stack and versions
- Next.js (current stable, App Router) · React · TypeScript in `strict` mode · Node LTS.
- Package manager: **pnpm** (commit the lockfile).
- Styling: **Tailwind CSS**, with the design tokens from `context/00-foundation.md` defined as CSS variables and mapped into the Tailwind theme. Don't hard-code colours anywhere else.
- Validation: **zod** for every server-action input, route-handler input and fixture shape.
- Later phases: Prisma + Neon (Postgres). Not wired in Phase 1.

## 2. Folder structure
```
app/
  page.tsx                  # the one screen (server component shell)
  layout.tsx                # fonts, tokens, <html lang="en">
  actions/                  # server actions, one file per area (runs.ts, review.ts, …)
  api/runs/[runId]/events/route.ts
  api/simulations/[jobId]/route.ts
components/
  ui/                       # shared primitives from Build 01 (Button, Chip, Modal, …)
  shell/                    # top bar, panels, review bar, footer
  inputs/ run/ dossier/ liability/ simulation/ review/ ask/ batch/   # one folder per feature
lib/
  data/                     # server-only data seam: the ONLY place that reads mocks or the DB
  mocks/                    # typed fixtures + event scripts
  auth/session.ts           # mock session in Phase 1
  types/                    # shared domain types (from the data contract)
  utils/                    # pure helpers (formatting, units)
tests/                      # e2e (Playwright); unit tests live next to their code
context/                    # specs, screenshots, build tracking; never import from here
```

## 3. TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`; use `unknown` and narrow it.
- Domain types live in `lib/types/` and mirror the data contract exactly (`Verdict`, `Grade`, `Endpoint`, `LiabilitySite`, `Run`, `RunVersion`, …).
- Use string-literal unions for enums (`type Verdict = 'prec' | 'supp' | 'gap' | 'alert'`), and switch on them exhaustively with a `never` check.
- Derive types from zod schemas (`z.infer`) where a schema exists; don't define the same shape twice.

## 4. Server vs client
- Server Components by default. Add `'use client'` only for interactivity, and keep client components small.
- Everything in `lib/data/` starts with `import 'server-only'`.
- Mutations → Server Actions. Reads → Server Components calling `lib/data/`. Live progress → client polling of the route handlers (1–2 s, stop on done, error or unmount).
- Browser-only libraries (3D viewer, trajectory viewer, structure editor) load via `next/dynamic` with `ssr: false`, behind a typed wrapper component.

## 5. Data layer and ownership
- Components never import `lib/mocks/` or Prisma. Only `lib/data/` does, and only `lib/data/` reads `USE_MOCKS`.
- Every `lib/data/` function begins by getting the session (`getSession()`) and scopes by `userId` + active `workspaceId`. **Never accept an owner or workspace ID from the client.** Look records up by owner and ID, never by ID alone.
- Return typed results. For actions, return `{ ok: true, data } | { ok: false, error: { code, message } }` rather than throwing to the client.
- Validate every action input with zod on the server, even when the client already validated.

## 6. Components
- One component per file; PascalCase file and component names. Props are typed with an interface named `<Component>Props`.
- Build shared primitives once in `components/ui/` (Build 01) and reuse them. Don't restyle a primitive inline per feature; add a variant.
- Keep components presentational where possible: feature state lives in the nearest sensible parent or a small hook (`useRunEvents`, `useSelection`).
- No prop drilling past 3 levels. Use a small context for screen-wide state (mode, selection, review status) instead.
- Don't use `useEffect` for derived state. Compute it during render.

## 7. Styling and tokens
- Use tokens only: colours, radii, spacing and fonts come from CSS variables and the Tailwind theme.
- Verdict and severity styles come from one mapping (`lib/utils/verdicts.ts`). Never re-type their colours.
- Use monospace for SMILES, sequences, IDs, versions and numeric data columns.
- Desktop-first; check at 1440, 1280 and 1024 (tablet). The input panel collapses below 1180.
- Motion only for progress ticks and section reveal; honour `prefers-reduced-motion`.

## 8. Accessibility (required, not polish)
- Use semantic elements: `<button>` for actions, `<a>` for navigation, and `<label>` for every input. Never put `onClick` on a `div` or `span`.
- Everything is keyboard-reachable with a visible focus ring. Modals and drawers trap focus, close on Esc and restore focus.
- Status is icon + text, never colour alone. Icons are `aria-hidden`; the text carries the meaning.
- Use `aria-expanded` on disclosure buttons, `aria-pressed` on toggles, `aria-live="polite"` on progress, and `role="alert"` on errors.
- Colour contrast meets WCAG 2.2 AA.

## 9. Product copy and scientific data
- Never "safe" as a verdict or conclusion; no overall score. Use the exact verdict and grade labels from the foundation.
- Copy is short, factual, sentence case, with no exclamation marks and no reassurance.
- Units have a space and use proper symbols: `25 °C`, `0.2 mg/mL`, `150 mg`, `Γ23`, `±`. Put formatting in `lib/utils/format.ts`.
- Never round or change scientific values from fixtures for display unless the spec says so. Show uncertainty (± SD) wherever it exists.
- Placeholders are visible (`[N]`, `[PLACEHOLDER]`), never invented numbers.

## 10. Errors, loading and empty states
- Every async view has loading, empty and error states, matching the reference screens where they exist.
- Errors are shown in the UI (banner or inline) with the reason and a next action. Never fail silently.
- Stubbed features show "Not connected yet" rather than doing nothing.
- Keep partial results when a later step fails.

## 11. Testing
- **Unit (Vitest + React Testing Library):** `lib/utils`, `lib/data` scoping, verdict mapping, the novel-excipient rule, severity by temperature, and reducer/state logic.
- **Component:** each primitive, plus keyboard behaviour for Modal, Drawer, Menu and GradeBadge (the tooltip shows on focus).
- **E2E (Playwright):** one happy-path test per build, plus the branch states the build owns (e.g. identity unresolved, error retry). Use the dev state switcher only in tests that need it.
- **Guard tests:** fail if the text "safe" appears as a verdict, if a component imports `lib/mocks`, or if a `lib/data` function takes a `workspaceId`/`userId` argument from the client.
- A build is not done until typecheck, lint and tests pass locally.

## 12. Dependencies
- Prefer the platform and existing deps. Each new dependency needs a one-line reason in the build report: what it does, why not a simpler option, and its maintenance status.
- Allowed as needed: zod, clsx/tailwind-merge, a small icon set (or inline SVG), a Mol*/3Dmol.js wrapper, Ketcher/JSME, a lightweight chart approach (plain SVG preferred).
- No UI kit that fights the design tokens; no state library unless context + hooks clearly fail.

## 13. Git and commits
- One branch per build: `build/NN-name`. Merge after the build report is reviewed.
- Conventional Commits: `feat(dossier): verdict matrix rows with sources`, `fix(liability): sync selection from sequence track`, `test(run): identity-unresolved e2e`, `chore: …`, `docs: …`.
- Small commits that each leave the app running. Never commit secrets or `.env*` (commit a `.env.example` instead).

## 14. Environment and security
- `.env.example` documents every variable (`USE_MOCKS=true` in Phase 1). No `NEXT_PUBLIC_` variables except those that are truly public.
- No secrets, keys or tokens in client code, mocks or tests.
- Treat all user input (SMILES, FASTA, CSV, chat) as untrusted: validate size and format with zod, and never render it as HTML.
- No browser storage (localStorage, sessionStorage) for run data; per-user data lives on the server.

## 15. Lint and format
- ESLint (Next.js config + `@typescript-eslint` + `jsx-a11y`) and Prettier. No disabled rules without a comment explaining why.
- Scripts: `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`.

## 16. Comments and docs
- Comment *why*, not *what*. Mark extension points with the later build or phase: `// TODO(build-07): disable when signed`, `// TODO(phase-2): replace mock with Prisma query`.
- Keep `README.md` setup steps current as builds add scripts or env vars.
