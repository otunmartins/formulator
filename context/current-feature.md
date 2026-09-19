# Current Build

Status: ready
Build: 03 · Run lifecycle
Spec: context/features/03-run-lifecycle.spec.md
Image: context/screenshots/03-run-lifecycle.png
Depends on: 01, 02 (both merged 2026-09-19)
Branch: build/03-run-lifecycle
Base: main
Loaded: 2026-09-19

## Goal
Drive the progress strip from mocked step events (`startRun` returns a run ID; the client polls the events route every 1–2 s) and handle the two interruptions: an unresolved identity pauses the run for a candidate or override, and a failed step shows an error banner with a retry that resumes from that step while keeping completed results (S04, S05, S06).

## Done when
Spec:
- [x] S04–S06 match their screens.
- [x] An unresolved identity pauses the run rather than failing it.
- [x] Retry does not re-run completed steps.
- [x] Sign off stays disabled unless the run is complete.

Foundation (every build):
- [x] The build's screens match their reference images in layout and copy.
- [x] No backend logic: data goes through `lib/data/` and returns mocks; flipping `USE_MOCKS` touches only `lib/data/`.
- [x] Every `lib/data/` function scopes by the session user and workspace; none accepts an owner or workspace ID from the client.
- [x] Never "safe" as a verdict, no overall score, and status is never shown by colour alone.
- [x] Keyboard-navigable with visible focus; honours prefers-reduced-motion.
- [x] The footer disclaimer is visible; no project layer exists.
- [x] Stubbed actions show "Not connected yet" rather than failing silently.
- [x] Nothing from a later build is started early.

## Open questions
None blocking. Doc-only: the spec mentions streamed events; foundation and task 1 say polling (built). S05's header says "Tween 80 HP-K" while its panel shows Polysorbate 80. The image still shows the removed Draw structure button.

## Decisions
Asked (2026-09-19):
- **Matrix area:** skeleton while running; once steps finish, a "Verdict matrix" hand-off card (S06 header line kept, e.g. "Precedent endpoints only · hazard step failed"; rows "Not connected yet") with a typed `endpoints` extension point for Build 04. No invented verdicts.
- **Scripts:** no registry match → identity unresolved; "Tween 80 HP-K" gets the image's two candidates, other unmatched names get the override only. Excipient "Polysorbate 20" → hazard fails (HTTP 504). Everything else (PS80, ALX-117, …) → happy path. The dev switcher jumps to S04–S06.
- **Run state:** mock run state in an httpOnly cookie (set only by server actions, zod-checked on read, scoped to the session user and workspace). Works on Vercel's serverless functions; replaced by Postgres in phase 2 inside `lib/data/` only.
- **Load example:** fills the panel and starts the PS80 × 1N8Z run straight away.
Decided myself:
- Step notes: the PS80 × 1N8Z values from the screens (identity "Polysorbate 80 · CAS 9005-65-6", "6 sources", "8 endpoints", "4 sites on 1N8Z"); other runs show "Complete". "Polysorbate 20" identity note uses CAS `[PLACEHOLDER]` (no fixture).
- Runs started this session appear in Recent runs (from the cookie) and reopen with their live status; fixture runs open as complete.
- Sign off becomes enabled only when the run is complete and shows "Not connected yet" (dialog is Build 07). Export and share links enable once results exist (partial or complete), also "Not connected yet" (S06: exports allowed on partial results).
- At ≤1180 px the input panel collapses when a run completes (Build 01 note).

## Plan
**Restatement**
- Build: mock event scripts with a pure timeline (happy / unresolved / hazard failure), the cookie run store behind `lib/data/`, `startRun` storing a run, `resolveIdentity` (candidate or CAS/SMILES override, recorded with user and time for the manifest) and `retryStep` actions, the events route returning live step state, a polling hook (1.5 s, stops on pause/error/complete/unmount), the progress strip states (animated tick, spinner, error, needs input), skeleton matrix, S05 identity card, S06 error banner with retry, hand-off matrix card, review-bar gating, dev switcher S04–S06.
- Won't touch: verdict rows and endpoint fixtures (04), liability map (05), simulation (06), sign-off dialog/manifest drawer (07), Ask (08), Batch (09).
- Files: `lib/mocks/runScripts.ts`, `lib/data/{runStore,runs}.ts`, `lib/types/{domain,runEvents}.ts`, `app/actions/{runs,dev}.ts`, `app/api/runs/[runId]/events/route.ts`, `components/run/*` (useRunEvents, ProgressStrip, SkeletonMatrix, IdentityResolver, StepErrorBanner, MatrixHandoff, RunArea), `components/shell/{Screen,screenState,EmptyState,ReviewBar,DevStateSwitcher}.tsx`, `components/ui/Icon.tsx`, `app/globals.css` (tick/reveal keyframes), tests.

**Tasks**
- [x] 1. feat(mocks): event scripts and a pure `timelineAt(state, now)` → steps, run state, candidates, error; unit tests (pause, resume at Precedent, retry keeps completed steps).
- [x] 2. feat(data): httpOnly cookie run store (zod-validated, owner + workspace scoped, last 10 runs); `createRun` stores a run with its script; `getRunEvents` from the timeline; Recent runs / open run include stored runs; `resolveRunIdentity`, `retryRunStep`; unit tests incl. another user's cookie run not visible.
- [x] 3. feat(actions): script selection in `startRun`; `resolveIdentity` and `retryStep` actions (zod; CAS/SMILES check); events route returns the extended shape; dev-only `startDevRun` (S04/S05/S06, refused in production); tests.
- [x] 4. feat(run): `useRunEvents` polling hook into screen state; progress strip states with animated tick and spinner (reduced motion honoured); skeleton matrix with section reveal; Load example fills and starts.
- [x] 5. feat(run): S05 identity card (candidate radios, override field, "Use and continue", validation), run resumes at Precedent.
- [x] 6. feat(run): S06 error banner with "Retry hazard step"; hand-off matrix card (partial and complete); review bar gating; tablet collapse after completion.
- [x] 7. feat(dev): switcher S04, S05, S06.
- [x] 8. test: component tests (strip states, resolver, banner, gating) + e2e (happy path to complete, unresolved → override → resumes at Precedent, hazard failure → retry keeps completed steps); keep earlier tests green.

**New dependencies:** none.

## Review
2026-09-19 · diff `main...HEAD` against the product rules, spec, foundation, S04–S06 at 1440/1280/1024 and the coding standards.
- **Medium** · At 1024 px, step status notes were cut off ("Needs your in…", "Failed · HTTP …"), so the status text itself was lost. **Fixed**: notes wrap to 2 lines below 1181 px, 1 line on desktop, full text in `title`.
- **Medium** · Focus dropped to `<body>` when "Use and continue" or "Retry" removed the focused control. **Fixed**: focus moves to the progress strip (`tabIndex=-1`); e2e asserts it.
- **Medium** · Skeleton rows pulsed: motion beyond progress ticks and section reveal (foundation hard rule). **Fixed**: static skeleton.
- **Low** · Banner copy differed from S06 ("Completed results below are kept"). **Fixed**: "Precedent results below are complete." (the step before the failed one).
- **Low** · Polling kept retrying on 4xx responses other than 404. **Fixed**: stops with an error notice; 5xx and network errors keep polling.
- **Low** · Opening a completed run shows the skeleton ("step 1 of 4") for one poll (~100 ms) before the hand-off card. **Open** (cosmetic; Build 04 replaces this area with the dossier read).
- **Low** · The disabled "Run manifest" link reads close to enabled text. **Open** (Build 01 styling; Build 07 enables it).
- **Low** · S06 matrix header chips (counts per verdict) and rows aren't shown. **Open** (Build 04 by decision; hand-off card marks the spot).
No product-rule issues: no "safe", no score, every status is icon + text, one screen, all run lookups owner + workspace scoped, dev action refused in production.

## Tests
2026-09-19 · **Checks run:** typecheck ✓ · lint ✓ · unit/component ✓ (132 passed, 16 files) · e2e ✓ (21 passed) · build ✓ · visual check ✓
- Visual: S04, S05, S06 against the reference at 1440, 1280 and 1024. Differences are by decision: S06 verdict chips and rows are Build 04, and the image's Draw structure button was removed in Build 02.
- Keyboard: Tab reaches the candidates (arrow keys switch), the override and "Use and continue"; Enter submits; "Retry hazard step" is reachable. Focus is visible throughout and lands on the progress strip after each action. No modals in this build; the Build 01 Esc/focus-trap e2e still passes.
- Reduced motion: tick, reveal and spinner animations drop to 0.01 ms (verified in Chromium with `reducedMotion: reduce`); status stays as text.
- Done-when evidence: pause → `run.spec` S05 (still paused after 2 s) + `runScripts.test`; retry keeps steps → `run.spec` S06 + `runScripts.test`; Sign off gating → `run.test` ReviewBar + e2e; scoping → `runStore.test` / `scoping.test`; mocks/`USE_MOCKS`/"safe" → `guards.test`; stubs → `run.test` + `shell.spec`.
- Flaky: `inputPanel.test.tsx` ("include or exclude chains", "sends only the active protein tab", Build 02) failed once in 6 full runs and couldn't be reproduced (0/3 alone, 0/4 full, 0/1 under build load). Probably timing under load; cause unconfirmed, tests unchanged.

## Log
- 2026-09-19 — Loaded Build 03 · Run lifecycle. Dependencies 01 and 02 merged. Spec and image read; 4 open questions.
- 2026-09-19 — start: 4 questions answered (see Decisions); plan written, 8 tasks. Status planned.
- 2026-09-19 — Tasks 1–2: timeline is a pure function of start time + user actions (no timers or server memory). Cookie store keeps up to 6 runs, dropping the oldest to stay under 3600 chars (browser cookie limit ~4 KB). Run IDs come from the clock and skip IDs already stored (a per-instance counter isn't safe on serverless). Resolved runs keep "Complete" notes for later steps (only the identity note changes).
- 2026-09-19 — Task 3: overrides are checked on the server: CAS numbers must have a valid check digit, SMILES get a loose shape check (allowed characters, balanced brackets; real parsing is phase 2). `startRun` calls `refresh()` so the run appears in Recent runs. The guard test caught the dev action importing `lib/mocks`; the backdating moved into `lib/data` (`createDevRun`).
- 2026-09-19 — Tasks 4–8: `RunArea` owns the strip and what sits under it (empty card, skeleton, identity card, error banner + precedent-only hand-off, complete hand-off). Load example and Run share `useStartRun`; Load example no longer sets the header itself (the started run does). Sign off enables only on complete (stub); exports/share enable on complete or partial (stub); Run manifest stays disabled (Build 07). Tablet (≤1180 px) collapses the panel when a completed run arrives, including opening a completed run. Truncated step notes carry a `title`. Checks: typecheck ✓ · lint ✓ · unit 132 ✓ · e2e 21 ✓ · visual S04/S05/S06 at 1440 ✓.
- 2026-09-19 — review: 3 medium + 2 low fixed, 3 low open (see Review). Checks after fixes: typecheck ✓ · lint ✓ · unit 132 ✓ · e2e 21 ✓.
- 2026-09-19 — test: all checks pass (132 unit, 21 e2e, build); visual, keyboard and reduced-motion checks done; all Done-when items ticked. One intermittent Build 02 unit-test failure noted. Status ready.
