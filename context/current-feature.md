# Current Build

Status: in-progress
Build: 01 · App shell (common to every screen)
Spec: context/features/01-app-shell.spec.md
Image: context/screenshots/01-app-shell.png
Depends on: — (first build)
Branch: build/01-app-shell
Base: main
Loaded: 2026-09-19

## Goal
Build the frame every later build plugs into: project setup, design tokens, shared UI primitives, the server-only `lib/data/` seam with mocks and a mock session, and the empty screen. When done, the app runs end to end with no results yet (S01, plus C01 Recent runs, C02 User/workspace menu, C03 Panel collapsed).

## Done when
Spec:
- [ ] S01 and C01–C03 match their screens.
- [ ] Every interactive element can be reached and used with the keyboard, with visible focus.
- [ ] Components never import mocks or Prisma; only `lib/data/` reads `USE_MOCKS`.
- [ ] Every `lib/data/` function scopes by the session user and workspace.
- [ ] The footer disclaimer is visible in every state.

Foundation (every build):
- [ ] The build's screens match their reference images in layout and copy.
- [ ] No backend logic: data goes through `lib/data/` and returns mocks; flipping `USE_MOCKS` touches only `lib/data/`.
- [ ] Every `lib/data/` function scopes by the session user and workspace; none accepts an owner or workspace ID from the client.
- [ ] Never "safe" as a verdict, no overall score, and status is never shown by colour alone.
- [ ] Keyboard-navigable with visible focus; honours prefers-reduced-motion.
- [ ] The footer disclaimer is visible; no project layer exists.
- [ ] Stubbed actions show "Not connected yet" rather than failing silently.
- [ ] Nothing from a later build is started early.

## Open questions
None blocking. (Image cites `docs/builds/...` paths; repo uses `context/features/`. Doc-only, no action.)

## Decisions
Asked (2026-09-19):
- Tooling: switch to **pnpm** (corepack) and set up full tooling in Build 01: zod, server-only, clsx, Vitest+RTL, Playwright, Prettier, scripts.
- Input panel: **follow the spec**: container, collapse control, section headings, "Run screen" button only; fields in Build 02. S01 intentionally differs from the image there.
- Discovery workspace runs: **visible `[PLACEHOLDER]` runs** (Draft), no invented science.
- "Load example" / click a recent run: **header only**: load the run summary via `lib/data/` into the run header in place; steps stay Waiting, empty card stays. TODO(build-03/04).
- "Run manifest": **disabled per spec** (image shows it active). TODO(build-07).
- Empty run header: **"SINGLE SCREEN" + "New screen" only**, no run ID or context line until a run is loaded.
Decided myself (A3/A4):
- C01–C03 backgrounds show a finished dossier (Build 04); menus/rail are matched over the empty screen.
- Recent-runs menu shows short IDs (`RUN-0918-0412`) via `lib/utils/format.ts`; data keeps the full contract ID.
- Active workspace lives in a cookie read by `lib/auth/session.ts`. `switchWorkspace` checks that the target workspace belongs to the session user, then calls `refresh()`. `lib/data/` functions never take user/workspace IDs.
- Opening a run in place uses a server action (`openRun`) returning the session-scoped summary, because navigation is not allowed.
- Sign out and the Ask edge tab: Sign out shows "Not connected yet"; the Ask tab opens the Drawer shell with "Not connected yet" (body is Build 08).
- Icons: inline SVG set in `components/ui/icons.tsx` (no icon dependency).

## Plan
**Restatement**
- Build: pnpm + tooling; tokens + Plex fonts; shared primitives in `components/ui/`; shell regions in `components/shell/`; server-only `lib/data/` with mocks, mock session, `USE_MOCKS`; `app/actions/` skeleton; polling route-handler stubs; dev state switcher (S01, C01–C03); tablet breakpoint.
- Won't touch: input fields (02), run progress/branches (03), dossier (04+), drawer bodies, exports, auth, Prisma.
- Files: `package.json`, `pnpm-lock.yaml` (replaces `package-lock.json`), `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `vitest.config.mts`, `playwright.config.ts`, `.env.example`, `.gitignore`, `README.md`, `app/{layout,page,globals.css}`, `app/actions/{runs,workspace}.ts`, `app/api/runs/[runId]/events/route.ts`, `app/api/simulations/[jobId]/route.ts`, `components/ui/*`, `components/shell/*`, `lib/{data,mocks,auth,types,utils}/*`, `tests/*`.

**Tasks**
- [x] 1. chore: pnpm via corepack (drop `package-lock.json`); scripts `typecheck`, `lint`, `format`, `test`, `test:e2e`; `noUncheckedIndexedAccess`; Prettier; jsx-a11y recommended; `.env.example` (`USE_MOCKS=true`); README.
- [x] 2. chore(test): Vitest + RTL + jsdom config, Playwright config, one smoke test each.
- [x] 3. feat(tokens): foundation tokens as CSS vars mapped into Tailwind v4 `@theme`; IBM Plex Sans/Mono via `next/font`; reduced-motion base; `lib/utils/verdicts.ts` (single verdict/severity mapping) + `format.ts`, with unit tests.
- [ ] 4. feat(data): `lib/types` + zod schemas; mock session (user + 2 workspaces, cookie-selected active workspace); fixtures (4 Formulation runs from C01, 2 `[PLACEHOLDER]` Discovery runs); `lib/data/` (`listWorkspaces`, `listRecentRuns`, `getRunSummary`) scoped by session; `USE_MOCKS` switch; unit tests for scoping (another user's or workspace's run not found).
- [ ] 5. feat(actions): `app/actions/workspace.ts` (`switchWorkspace`), `app/actions/runs.ts` (`openRun`, `loadExample`), typed `ActionResult`, zod inputs; route-handler stubs for events and simulations (session-scoped, return mock "pending").
- [ ] 6. feat(ui): primitives Button, IconButton, Segmented, Tabs, Card, Chip, VerdictChip (4, icon + text), GradeBadge + A–E legend (hover and focus), Modal (trap, Esc, restore focus), Drawer, Menu (arrow keys, Esc), Notice ("Not connected yet"), icons; component tests for keyboard behaviour of Modal, Drawer, Menu, GradeBadge.
- [ ] 7. feat(shell): screen layout: sticky TopBar (name, Single | Batch, Recent runs, user menu), InputPanel skeleton + collapse rail, RunHeader, ProgressStrip (4× Waiting), EmptyState ("Load example"), ReviewBar (Draft, all disabled), Footer disclaimer, Ask edge tab + drawer shell; Batch mode placeholder (TODO build-09).
- [ ] 8. feat(shell): wire menus: Recent runs from `listRecentRuns()`, open a run / Load example into the header, workspace switch reloads runs, Sign out stub.
- [ ] 9. feat(dev): dev-only state switcher (S01, C01, C02, C03), not rendered when `NODE_ENV=production`.
- [ ] 10. feat(shell): tablet (≤1180px) panel narrows; collapse/expand rail (C03) with `aria-expanded`.
- [ ] 11. test: e2e happy path (S01, C01, C02 switch, C03, keyboard) + guard tests (no "safe" verdict, components don't import `lib/mocks`, `lib/data` exports take no userId/workspaceId).

**New dependencies (CODING_STANDARDS §12)**
- `zod`: validates action/route inputs and fixture shapes (standards require it).
- `server-only`: build error if `lib/data/` is imported client-side (Next recommends installing it).
- `clsx`: conditional class names; tiny, stable. No tailwind-merge unless variants conflict.
- dev `vitest`, `@vitejs/plugin-react`, `jsdom`, `vite-tsconfig-paths`, `@testing-library/{react,dom,user-event,jest-dom}`: unit + component tests (Next's documented Vitest setup).
- dev `@playwright/test`: e2e (standards §11).
- dev `prettier`: formatting (standards §15). jsx-a11y is already bundled with `eslint-config-next`, so only its config changes.

## Review
—

## Tests
—

## Log
- 2026-09-19 — Loaded Build 01 · App shell. No dependencies. Spec and image read; 8 open questions recorded.
- 2026-09-19 — start: 6 questions answered (see Decisions); read Next 16 docs (fonts, route handlers, server actions, data security, Vitest); plan written, 11 tasks. Status planned.
- 2026-09-19 — go-ahead; Status in-progress. Tasks 1–2: pnpm 12 via `corepack pnpm` (global shim needs admin on this machine), `packageManager` pinned, `unrs-resolver` build allowed in `pnpm-workspace.yaml`; jsx-a11y recommended rules taken from the plugin instance eslint-config-next loads (pnpm doesn't hoist it).
