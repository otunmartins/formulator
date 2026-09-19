# Current Build

Status: in-progress
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
- [ ] S03 matches its screen (without the Draw structure button).
- [ ] Monospace is used for SMILES, sequences and IDs.
- [ ] Pressing Run calls the `startRun` server action with the typed input.

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
- [ ] 4. feat(ui): form primitives: Field (label, hint, inline error wired via aria-describedby/aria-invalid), TextInput (mono option, unit addon), Select, Textarea, Switch (role=switch), FileDrop; component tests.
- [ ] 5. feat(inputs): Excipient field + on-blur identity hint; Polymer switch revealing repeat unit (mono), end groups, approx. DP, residual monomers.
- [ ] 6. feat(inputs): Protein tabs: PDB ID + chain chips (toggle include/exclude), UniProt ID and Sequence (FASTA) with "predicted structure, grade C" note, Upload dropzone (.pdb/.cif/.mmcif, size check); only the active tab is kept for submit.
- [ ] 7. feat(inputs): Context: route SC/IV/IM, dose + unit, frequency, excipient concentration (mg/mL), storage 4/25/40 °C.
- [ ] 8. feat(inputs): Run validates, shows inline errors (focus first invalid field), calls `startRun`, fills the header; `disabled` puts the panel in a disabled fieldset (TODO(build-07)); Load example fills the panel.
- [ ] 9. test: component tests (tabs, polymer switch, active-tab-only submit, errors) + e2e (fill and run, Load example fills panel, keyboard); update Build 01 e2e for the new Run behaviour.

**New dependencies:** none.

## Review
—

## Tests
—

## Log
- 2026-09-19 — Loaded Build 02 · Inputs panel. Dependency 01 merged. Spec and image read; 6 open questions.
- 2026-09-19 — start: 6 questions answered (Draw structure removed; see Decisions); read Next forms guide; plan written, 9 tasks. Status planned.
