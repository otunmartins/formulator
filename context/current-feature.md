# Current Build

Status: ready
Build: 02 · Inputs panel
Spec: context/features/02-inputs.spec.md
Image: context/screenshots/02-inputs.png
Depends on: 01 (merged 2026-09-19)
Branch: build/02-inputs
Base: main
Loaded: 2026-09-19

## Goal
Fill the Single-mode input panel: excipient field (name, CAS or SMILES) with a resolved-identity hint, polymer fields, protein source tabs (PDB ID with chain chips, UniProt ID, Sequence, Upload) and context. Client-side validation with inline errors, a panel-wide disabled state for Build 07, and Run calls the `startRun` server action with the typed input (S03; S02 removed by decision).

## Done when
Spec (S02 and the modal item removed by decision, 2026-09-19):
- [x] S03 matches its screen (without the Draw structure button). (visual at 1440/1280/1024; e2e checks the button is gone)
- [x] Monospace is used for SMILES, sequences and IDs. (component test: excipient, PDB ID, repeat unit, FASTA)
- [x] Pressing Run calls the `startRun` server action with the typed input. (component test asserts the exact payload; e2e: header fills with the returned run ID)

Foundation (every build):
- [x] The build's screens match their reference images in layout and copy. (S03; S02 removed by decision)
- [x] No backend logic: data goes through `lib/data/` and returns mocks; flipping `USE_MOCKS` touches only `lib/data/`. (guard tests)
- [x] Every `lib/data/` function scopes by the session user and workspace; none accepts an owner or workspace ID from the client. (new `lookupIdentity` / `lookupStructure` / `createRun` go through the session; guard test on parameters)
- [x] Never "safe" as a verdict, no overall score, and status is never shown by colour alone. (guard tests; errors are icon + text; excluded chips say "excluded")
- [x] Keyboard-navigable with visible focus; honours prefers-reduced-motion. (e2e keyboard test; Tab → chip → Space toggles with visible ring; switch transition 0.15 s → 0 under `reduce`)
- [x] The footer disclaimer is visible; no project layer exists.
- [x] Stubbed actions show "Not connected yet" rather than failing silently. (Batch Run e2e)
- [x] Nothing from a later build is started early.

## Open questions
None blocking. Doc-only: the image cites `docs/builds/...` paths and still shows the Draw structure button and S02.

## Decisions
Asked (2026-09-19):
- **Structure editor: removed entirely.** No "Draw structure" button and no S02 modal; the Excipient field takes name, CAS or SMILES at full width. Specs/foundation get a dated note.
- **Run:** `startRun` (zod on the server) returns a mock run ID + summary; the header fills in place, steps stay Waiting. TODO(build-03): polling.
- **Identity hint:** separate read-only `lookupIdentity`; `resolveIdentity` stays reserved for Build 03's override.
- **ALX-117:** matched by name; hint "No registry match · user SMILES" with SMILES shown as `[PLACEHOLDER]`.
- **Protein contract extended:** `{source:"pdb", id, chains, excludedChains}` · `{source:"uniprot", id}` · `{source:"sequence", fasta}` · `{source:"upload", fileName, format:"pdb"|"mmcif"}`. Upload sends metadata only in Phase 1.
- **Defaults:** empty panel with SC and 25 °C; "Load example" fills the panel and the header with PS80 × 1N8Z (changes Build 01's header-only behaviour).

## Plan
**Restatement**
- Build: the Single-mode input panel (Excipient + identity hint, Polymer switch and fields, Protein tabs with 1N8Z chain chips, Context), one shared zod run-input schema with inline errors, `lookupIdentity` / `lookupStructure` reads and `startRun` against mocks, panel-wide disabled state, and Load example filling the panel.
- Won't touch: run progress/branches (03), dossier (04+), Batch panel (09), sign-off wiring (07; only the `disabled` hook), no structure editor.
- Files: `lib/types/runInput.ts`, `lib/mocks/{identities,structures,runs}.ts`, `lib/data/{identity,runs}.ts`, `app/actions/{inputs,runs}.ts`, `components/ui/{Field,TextInput,Select,Textarea,Switch,FileDrop}.tsx`, `components/inputs/*` (ExcipientField, PolymerFields, ProteinTabs, ChainChips, ContextFields, useRunInput), `components/shell/{InputPanel,screenState,EmptyState}.tsx`, tests, and doc notes in `context/features/02-inputs.spec.md`, `context/features/01-app-shell.spec.md`, `context/00-foundation.md`, `context/PROJECT_OVERVIEW.md`.

**Tasks**
- [x] 1. docs: record the Draw structure removal (02 spec: S02, task 2, Done-when; 01 spec S01 action; foundation component inventory, state model `modal`, builds table; overview) and the protein contract extension.
- [x] 2. feat(types): run-input zod schema (excipient + polymer, 4 protein variants, context), draft ↔ typed conversion with field errors; extend the Example fixture with full inputs; unit tests.
- [x] 3. feat(data): mock identities (PS80 by name/CAS, ALX-117) and structures (1N8Z chains A light, B heavy (Fab), C antigen excluded by default); session-scoped `lookupIdentity`, `lookupStructure`, `createRun` (mock run ID, not persisted); actions `lookupIdentity`, `lookupStructure`, `startRun`; unit tests incl. scoping and invalid input.
- [x] 4. feat(ui): form primitives: Field (label, hint, inline error wired via aria-describedby/aria-invalid), TextInput (mono option, unit addon), Select, Textarea, Switch (role=switch), FileDrop; component tests.
- [x] 5. feat(inputs): Excipient field + on-blur identity hint; Polymer switch revealing repeat unit (mono), end groups, approx. DP, residual monomers.
- [x] 6. feat(inputs): Protein tabs: PDB ID + chain chips (toggle include/exclude), UniProt ID and Sequence (FASTA) with "predicted structure, grade C" note, Upload dropzone (.pdb/.cif/.mmcif, size check); only the active tab is kept for submit.
- [x] 7. feat(inputs): Context: route SC/IV/IM, dose + unit, frequency, excipient concentration (mg/mL), storage 4/25/40 °C.
- [x] 8. feat(inputs): Run validates, shows inline errors (focus first invalid field), calls `startRun`, fills the header; `disabled` puts the panel in a disabled fieldset (TODO(build-07)); Load example fills the panel.
- [x] 9. test: component tests (tabs, polymer switch, active-tab-only submit, errors) + e2e (fill and run, Load example fills panel, keyboard); update Build 01 e2e for the new Run behaviour.

**New dependencies:** none.

## Review
Reviewed 2026-09-19 against the spec (S03; S02 removed by decision), the image, foundation and standards; UI checked at 1440, 1280 and 1024. Product rules (no "safe", icon + text errors), session scoping of `lib/data/`, and build boundaries: no issues.
- [medium] A stale chain lookup could overwrite a newer PDB ID (blur, then edit before the lookup returns): fixed, `update` takes a function and the result applies only if the ID is unchanged; reducer test.
- [medium] "Check the N highlighted fields" counted errors hidden by switching protein tab or turning Polymer off: fixed, those errors clear with the switch/tab; reducer test.
- [medium] Draft updates called `setErrors` from inside a state updater (impure, runs twice in dev): fixed, draft + errors now share one reducer (`formReducer`).
- [low] A failed identity lookup left the hint blank: fixed, "Couldn't look up this identity. It will be checked when the run starts."
- [low] Found in the task 9 visual check and fixed there: dose unit select squashed the input; tabs wrapped; selects clipped text.
- [low] Required fields aren't marked (visually or `aria-required`): open (every field is required except polymer extras; revisit with Build 03's identity flow).
- [low] Enter in a field doesn't run the screen (no `<form>`): open (Run is one Tab away; avoids accidental runs).
- [low] Residual monomers typed without a space after the comma ("oxide,1,4-dioxane") stay one item: open (hint says "Separate with commas").
- [low] Frequency (every 2 weeks) and dose unit (mg) have defaults the spec doesn't set: open (a select needs a value; both are visible).
- [low] Runs started here aren't stored, so they don't appear in Recent runs: open (Phase 1, no persistence).

## Tests
typecheck ✓ · lint ✓ · format ✓ · tests ✓ (91 unit/component/guard passed) · e2e ✓ (16 passed) · build ✓ · visual check ✓
- Visual: S03 (polymer on, Sequence tab) against the reference at 1440; panel at 1280 and 1024; error state; header after Run.
- Keyboard: Tab into chain chips, Space toggles (visible focus ring); tabs with arrow keys; Polymer switch with Space; storage buttons with Enter.
- prefers-reduced-motion: Polymer switch transition 0.15 s → 0.

## Log
- 2026-09-19 — Loaded Build 02 · Inputs panel. Dependency 01 merged. Spec and image read; 6 open questions.
- 2026-09-19 — start: 6 questions answered (Draw structure removed; see Decisions); read Next forms guide; plan written, 9 tasks. Status planned.
- 2026-09-19 — Tasks 5–8 in one commit (sections share the draft provider). `RunInputProvider` holds draft/errors/identity; `loadExample` now returns `{example, structure, identity}` so one call fills the panel. Residual monomers split on commas not followed by a digit ("1,4-dioxane"). Unit addons are part of the input's description. Run shows "Check the N highlighted fields" (role=alert) and focuses the first invalid field. Created runs are not stored (Phase 1), so they don't appear in Recent runs.
- 2026-09-19 — Interlude on main: pinned pnpm 10.34.5 for Vercel compatibility (`a0fdae7`), merged into this branch.
- 2026-09-19 — Task 9: 11 component tests (`components/inputs/inputPanel.test.tsx`: defaults, mono, identity hint, polymer switch, errors + focus, typed startRun, chains, active tab only, server rejection, Load example, disabled) and 6 e2e (`tests/e2e/inputs.spec.ts`); Build 01's "Run screen stub" e2e now checks the Batch stub. Visual check at 1440/1024 found the dose unit select eating the input and tabs wrapping: fixed (fixed-width unit wrapper, select padding, nowrap tabs). All 9 tasks done. Checks: typecheck ✓ lint ✓ format ✓ unit 88/88 ✓ e2e 16/16 ✓. Next: `/feature review`.
- 2026-09-19 — review: 3 medium + 1 low fixed (plus 1 low fixed in task 9), 5 low open. typecheck ✓ lint ✓ format ✓ unit 91/91 ✓ e2e 16/16 ✓. Status review.
- 2026-09-19 — test: all checks pass (unit 91, e2e 16, build ✓); visual, keyboard and reduced motion verified; all Done-when ticked. Status ready.
