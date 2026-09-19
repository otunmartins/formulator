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

## 2026-09-19 — Build 02 · Inputs panel (merged)
**Status:** Done
**Done when:** all 11 ticked and verified by running (S03 matches; S02 removed by decision; monospace for SMILES, sequences and IDs; Run calls `startRun` with the typed input (component test on the exact payload, e2e header fill); foundation acceptance incl. session-scoped lookups, keyboard, reduced motion, "Not connected yet" stubs).
**What I built:**
- Shared zod run-input schema (excipient + polymer, 4 protein sources, context) used in the browser and in `startRun`; draft ↔ typed conversion with field errors.
- Mock `lookupIdentity` (PS80 by name/CAS; ALX-117 `[PLACEHOLDER]` SMILES) and `lookupStructure` (1N8Z chains, antigen excluded by default), session-scoped; `startRun` → `createRun` mock summary; header fills in place.
- Form primitives: Field, TextInput, Select, Textarea, Switch, FileDrop.
- Panel: Excipient + identity hint, Polymer fields, Protein tabs (chain chips, grade C note, drop zone), Context; validation with focus on the first invalid field and an announced error count; panel-wide disabled state (Build 07); Load example fills the panel.
**Files:** docs (02/01 specs, foundation, overview, standards: structure editor removed, protein contract extended) · `lib/types/{runInput,lookups}.ts`, `domain.ts` context schema · `lib/mocks/{identities,structures}.ts` · `lib/data/inputs.ts`, `createRun` in `lib/data/runs.ts` · `app/actions/inputs.ts`, `startRun` + `loadExample` in `app/actions/runs.ts` · `components/ui/{Field,TextInput,Select,Textarea,Switch,FileDrop,controlStyles}` · `components/inputs/*` · `InputPanel`, `Screen`, `EmptyState`, `Tabs` · 5 new test files + `tests/e2e/inputs.spec.ts`.
**Decisions:** asked: structure editor removed; Run fills the header; separate `lookupIdentity`; ALX-117 SMILES placeholder; protein contract extended; empty panel, Load example fills it. Mine: monomer split ignores comma + digit ("1,4-dioxane"); units in the input's description; `loadExample` returns example + structure + identity; draft and errors in one reducer.
**Stubs and placeholders:** ALX-117 SMILES `[PLACEHOLDER]`; uploads read metadata only; runs not stored (TODO build-03 / phase 2); Batch Run "Not connected yet".
**Deviations from spec or screens:** no Draw structure button or S02 modal (decision); the reference image still shows both.
**Checks run:** typecheck ✓ · lint ✓ · format ✓ · tests ✓ (91 passed) · e2e ✓ (16 passed) · build ✓ · visual check ✓
**Open questions / next build needs:** open low findings: required fields not marked; Enter doesn't run; monomers without a space after the comma stay one item; frequency/dose-unit defaults not in the spec; started runs not in Recent runs. Build 03: polling for the run `startRun` returns, `resolveIdentity` override, collapse the panel on tablet after a run.
Also on main during this build: pnpm pinned to 10.34.5 so Vercel's pnpm 9/10 can install (`a0fdae7`).

## 2026-09-19 — Build 03 · Run lifecycle (merged)
**Status:** Done
**Done when:** all 12 ticked and verified by running (S04–S06 match at 1440/1280/1024; unresolved identity pauses, still paused after 2 s (e2e); retry keeps Identity and Precedent done (e2e + timeline unit tests); Sign off enabled only when complete (component + e2e); foundation acceptance incl. scoping, guard tests, keyboard, reduced motion, "Not connected yet" stubs).
**What I built:**
- Mock event scripts (happy, identity unresolved, hazard HTTP 504) with a pure `timelineAt`: progress is computed from start time + user actions, no timers or server memory.
- httpOnly cookie run store (zod-checked, user + workspace scoped, last 6 runs); started runs appear in Recent runs.
- Actions: `startRun` picks the script; `resolveIdentity` (candidate or CAS/SMILES override, server-checked, recorded with user and time for the manifest); `retryStep`; dev-only `startDevRun` (refused in production). Events route returns live steps; `useRunEvents` polls every 1.5 s and stops when settled, on unmount or on a client error.
- UI: progress strip (animated tick, spinner, error, needs input), static skeleton matrix, S05 identity card, S06 error banner with retry, matrix hand-off card for Build 04, review-bar gating, tablet collapse, focus to the strip after resolve/retry. Load example fills and starts; dev switcher S04–S06.
**Files:** `lib/mocks/runScripts.ts` · `lib/data/{runStore,runs}.ts` · `lib/types/runEvents.ts` · `lib/utils/identifiers.ts` · `app/actions/{runs,dev}.ts` · `app/api/runs/[runId]/events/route.ts` · `components/run/*` · `components/shell/{Screen,screenState,EmptyState,InputPanel,ReviewBar,RunHeader,DevStateSwitcher}` (old `shell/ProgressStrip` removed) · `components/ui/Icon.tsx` · `app/globals.css` · tests: `runScripts`, `runStore`, `identifiers`, `run.test.tsx`, `tests/e2e/run.spec.ts`, actions/scoping updates.
**Decisions:** asked: skeleton, then a hand-off card with no invented verdicts; script selection by excipient; run state in a cookie; Load example starts the run. Mine: step notes from the screen fixtures (Polysorbate 20 CAS `[PLACEHOLDER]`); Sign off / exports / share are stubs, exports allowed on partial results; Run manifest stays disabled; opening a completed run at tablet width also collapses the panel; step notes wrap to 2 lines on tablet; focus moves to the strip after resolve/retry.
**Stubs and placeholders:** Sign off, Export PDF/DOCX and Copy share link show "Not connected yet"; verdict rows "not connected yet" (Build 04); Polysorbate 20 CAS `[PLACEHOLDER]`; SMILES override is a loose shape check (parsing is phase 2).
**Deviations from spec or screens:** polling instead of the streams the spec mentions (foundation says polling); S06 verdict chips and rows are Build 04; the image still shows the removed Draw structure button.
**Checks run:** typecheck ✓ · lint ✓ · tests ✓ (132 passed) · e2e ✓ (21 passed) · build ✓ · visual check ✓ (plus keyboard and reduced-motion passes)
**Open questions / next build needs:** open low findings: a brief skeleton flash when opening a completed run; the disabled Run manifest link reads close to enabled; two Build 02 `inputPanel` tests failed once in 6 runs (not reproduced). Build 04: replace `MatrixHandoff` with verdict rows, honour `scope: "precedent"` on partial runs, and load the dossier for completed runs.

## 2026-09-19 — Build 04 · Dossier: verdict matrix (merged)
**Status:** Done
**Done when:** all 11 ticked and verified by running (S07 and S15 match at 1440/1280/1024; "safe" absent per guard test, fixture test and an e2e page check; verdicts are icon + text with the A–E legend on hover and keyboard focus; foundation acceptance incl. session-scoped dossier reads, mocks only in `lib/data`, keyboard, reduced motion).
**What I built:**
- Endpoint/Source/Dossier contract with `step` ("precedent" | "hazard"); 16 endpoint rows copied from S07 and S15, zod-validated at load; pure `applyNovelRule` and `verdictCounts`.
- `getDossier` (owner + workspace scoped): all endpoints when complete, only completed steps' endpoints after a failure, none while running; the novel rule is applied there, so no caller can show a positive verdict for a novel excipient. Served by `GET /api/runs/[runId]/dossier`; each stored run records its endpoint set (start, and on identity resolve).
- Verdict matrix: per-verdict counts + "No overall score · each endpoint stands alone", rows with verdict chip, grade badge, basis, inline out-of-domain warning, expandable sources (`aria-expanded`/`aria-controls`); skeleton while loading and an error card with "Try again"; NovelBanner (S15); partial mode under the S06 banner; placeholder row for excipients with no fixture. Dev switcher gains S07 and S15; dev S06 now uses PS80.
**Files:** `lib/types/dossier.ts` · `lib/mocks/endpoints.ts` · `lib/utils/dossier.ts` · `lib/data/dossier.ts` · `app/api/runs/[runId]/dossier/route.ts` · `components/dossier/*` · changed: `lib/data/runs.ts`, `lib/mocks/{runScripts,runs}.ts`, `lib/utils/format.ts` (`formatConc`), `lib/types/runInput.ts`, `components/run/RunArea.tsx` (MatrixHandoff removed), `components/shell/{screenState,DevStateSwitcher}.tsx`, `components/ui/{Chip,VerdictChip}.tsx` (`size="sm"`), `app/actions/dev.ts`, `context/00-foundation.md` · tests: `dossier.test` (utils/data/components), `tests/e2e/dossier.spec.ts`, updates to `run.spec`, `runStore.test`, `runScripts.test`, `format.test`, `inputPanel.test`.
**Decisions:** asked: `[PLACEHOLDER]` sources where the image shows none; endpoint sets by excipient with fixture text as-is; `step` added to the contract; a dedicated dossier route; rows collapsed by default; dev S06 uses PS80 so partial mode shows the image's 3 precedent rows. Mine: OOD text stored without its "Out of domain:" prefix (the UI adds it); `size="sm"` chips for the header counts; ALX-117 step notes from S15; fixed-width verdict column; `useId` source-panel ids; `formatConc` shows whole numbers with one decimal (1 → "1.0").
**Stubs and placeholders:** 14 rows carry one `[PLACEHOLDER]` source; excipients without a fixture show "No endpoint fixture for this excipient [PLACEHOLDER]"; ALX-117's cut-off repeat-unit tail and PLGA DP stay `[PLACEHOLDER]`; ALX-117 SMILES `[PLACEHOLDER]` (Build 02).
**Deviations from spec or screens:** rows start collapsed (the image shows one expanded, by decision); the image still shows the removed Draw structure button; the liability map and simulation below the matrix are Builds 05–06.
**Checks run:** typecheck ✓ · lint ✓ · tests ✓ (164 passed) · e2e ✓ (27 passed) · build ✓ · visual check ✓ (plus a keyboard pass)
**Open questions / next build needs:** open low findings: a Tween→PS80 resolved run keeps its typed title; the batch fixture run opens in the single-run view (Build 09); the partial header text is fixed to the hazard step; very small concentrations would print in exponent form. Fixed during testing: the intermittent Build 02 `inputPanel` failures (Load example header race + a timeout too small for whole-Screen tests). Build 05: render the liability map below the matrix on a complete run (extension point marked in `DossierSection`) and keep it hidden in partial mode.
