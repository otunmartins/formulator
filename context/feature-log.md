# Build Log

History of ended builds. `/feature end` adds each one, with its build report (AI_INTERACTION A7). Newest entries go at the bottom. `/feature load` checks this file to confirm a build's dependencies are merged.

<!-- Entry heading format:
## YYYY-MM-DD — Build NN · <Name> (merged | pr-opened | committed | abandoned)
followed by the A7 report.
-->

## 2026-09-19 — Build 01 · App shell (merged)
**Status:** Done
**Done when:** all 13 ticked and verified by running (S01/C01–C03 match with the deviations below; keyboard + visible focus; only `lib/data/` touches mocks/`USE_MOCKS` (guard tests); session scoping (unit tests, 404 for another user's run on the prod build); footer in every state; foundation acceptance incl. reduced motion, "Not connected yet" stubs, nothing from later builds).
**What I built:**
- Tooling: pnpm (corepack), Vitest + RTL, Playwright, Prettier, jsx-a11y recommended; `typecheck` runs `next typegen` first.
- Tokens as CSS vars mapped into Tailwind v4 `@theme`; IBM Plex Sans/Mono; reduced-motion rule; `lib/utils/verdicts.ts` (single verdict/grade/severity mapping) + `format.ts`.
- Data seam: mock session (cookie-selected workspace, checked against ownership); server-only `lib/data/` (`source`, `runs`, `workspaces`) scoped by session; zod-validated fixtures incl. a `usr_other` run.
- Actions `switchWorkspace`, `openRun`, `loadExample` (zod, `ActionResult`); polling route stubs (400 bad ID, 404 not found/not owned).
- `components/ui/`: Button, IconButton, Segmented, Tabs, Card, Chip, VerdictChip, GradeBadge + A–E legend, Modal, Drawer, Menu, Notice, Icon, useFocusTrap.
- Shell: top bar, collapsible input panel + rail, run header, progress strip, empty state, review bar, footer, Ask tab + drawer shell, dev-only state switcher, tablet breakpoint (≤1180px).
**Files:** config (`package.json`, `pnpm-lock.yaml` replacing `package-lock.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, Prettier, Vitest, Playwright, `.env.example`, `.gitignore`, `README.md`) · `app/` (layout, page, globals.css, actions, api routes) · `lib/` (auth, data, mocks, types, utils) · `components/ui/*` · `components/shell/*` · tests (co-located unit, `tests/guards.test.ts`, `tests/e2e/*`).
**Decisions I made:** "Load example" is a template with no run ID; missing fixture context shows `[PLACEHOLDER]`; real clock for run times; one reducer + context for screen state; dev switcher inline in the top bar; batch runs switch mode to Batch; review chip reflects a loaded run's status; action errors are `role="alert"`; e2e reuses dev server on :3000; CLAUDE.md/AGENTS.md excluded from Prettier.
**Stubs and placeholders:** Run screen, Sign out, Ask drawer → "Not connected yet"; review-bar actions disabled; events route returns all-pending (TODO build-03); simulation route always 404 (TODO build-06); Discovery runs `[PLACEHOLDER]`; Batch mode "not connected yet" card (TODO build-09).
**Deviations from spec or screens:** input panel has headings only (fields in Build 02); Run manifest disabled (image shows active); C01–C03 over the empty screen rather than a dossier; Today/Yesterday follows the real date.
**Checks run:** typecheck ✓ · lint ✓ · tests ✓ (50 passed) · e2e ✓ (10 passed) · build ✓ · visual check ✓
**Open questions / next build needs:** open low findings: disabled review-bar buttons not focusable (Build 07: `aria-disabled` + reason); server time zone for run times (phase 2); Menu/Notice multi-export files; 5px inner radius not a token. Build 02 fills `InputPanel` sections; Build 03 replaces the Run-screen stub with `startRun`, replays events via `getRunEvents`, and collapses the panel on tablet after a run.
