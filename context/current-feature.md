# Current Build

Status: in-progress
Build: 04 · Dossier: verdict matrix
Spec: context/features/04-verdict-matrix.spec.md
Image: context/screenshots/04-verdict-matrix.png
Depends on: 01, 03 (both merged 2026-09-19)
Branch: build/04-verdict-matrix
Base: main
Loaded: 2026-09-19

## Goal
Replace Build 03's matrix hand-off with the endpoint-by-endpoint dossier: verdict chip (icon + text), evidence grade with A–E legend, basis, inline out-of-domain warnings on grade D rows, and expandable sources, under a header of per-verdict counts and "No overall score" (S07). Enforce the novel-for-route rule (no Precedented/Supported verdicts, "Needs a nonclinical package" banner, S15) and show only the endpoints present after a failed step (partial mode from S06).

## Done when
Spec:
- [ ] S07 and S15 match their screens.
- [ ] The word "safe" never appears as a verdict.
- [ ] Every verdict shows an icon + text, and the grade legend appears on hover and keyboard focus.

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
None blocking. Doc-only: the image reuses RUN-2026-0918-0412 for both screens; S15's panel shows polymer SMILES fields for ALX-117 that Build 02's fixture has as `[PLACEHOLDER]`. The liability map and simulation card below the matrix are Builds 05–06.

## Decisions
Asked (2026-09-19):
- **Sources:** rows without sources in the image show "Sources (1)" with one visible `[PLACEHOLDER]` source; the two expanded rows use the image's sources (PS80 peroxide: 3, ALX-117 peroxide: 2).
- **Endpoint sets:** by excipient, fixture text as-is whatever the context. PS80 set for runs resolved to PS80 (name, CAS 9005-65-6, candidate or override); ALX-117 set (novel for SC) for ALX-117; any other excipient gets one visible "No endpoint fixture for this excipient [PLACEHOLDER]" row.
- **Contract:** add `step: "precedent" | "hazard"` to `Endpoint` (types + foundation data contract); partial mode filters on it.
- **Dossier read:** session-scoped `GET /api/runs/[runId]/dossier` → `getDossier` in `lib/data/`, fetched once when a run settles with results.
- **Expansion:** all rows collapsed by default; any number can be open (`selectedEndpointIds`).
- **S06 rows (asked during task 2):** the dev switcher's S06 starts PS80 × 1N8Z on the hazard-failure script, so partial mode shows the image's 3 Precedented rows. Typing "Polysorbate 20" still fails at hazard and shows the placeholder row (no fixture).

## Plan
**Restatement**
- Build: endpoint fixtures (PS80 × 1N8Z 8 rows, ALX-117 8 rows) with `step` and zod checks; pure novel-for-route rule and verdict counts; `getDossier` (owner-scoped, complete → all endpoints, error → endpoints of completed steps only, running/paused → none) and its route; the client fetch into screen state; VerdictMatrix (header counts + "No overall score · each endpoint stands alone", rows with chevron/aria-expanded, VerdictChip, GradeBadge, basis, OOD warning, SourceList), NovelBanner, the no-fixture placeholder row; dev switcher S07 and S15.
- Won't touch: liability map (05), simulation (06), sign-off/manifest (07), Ask (08), batch (09). Build 03 changes limited to: `RunArea` renders the matrix instead of `MatrixHandoff` (removed), stored runs record their endpoint set, ALX-117 step notes from S15.
- Files: `lib/types/dossier.ts`, `lib/mocks/endpoints.ts`, `lib/utils/dossier.ts`, `lib/data/dossier.ts`, `lib/data/runs.ts` + `lib/mocks/runScripts.ts` (endpoint set on stored runs, ALX notes, dev runs), `app/api/runs/[runId]/dossier/route.ts`, `components/dossier/*` (VerdictMatrix, VerdictRow, SourceList, OodWarning, NovelBanner, useDossier), `components/run/RunArea.tsx`, `components/shell/{screenState,DevStateSwitcher}.tsx`, `app/actions/dev.ts`, `context/00-foundation.md` (contract), tests.

**Tasks**
- [x] 1. feat(types): `Endpoint`/`Source`/`Dossier` zod schemas with `step`; PS80 and ALX-117 fixtures from the image (placeholder sources where none shown); pure `applyNovelRule` and `verdictCounts`; unit tests (novel rule suppresses prec/supp, counts, no "safe"). Foundation contract gets `step`.
- [x] 2. feat(data): stored runs record their endpoint set (`ps80` / `alx117` / none) at start and on identity resolve; ALX-117 step notes from S15; `getDossier` with partial filtering and the novel rule; dossier route; unit tests incl. another user's run → 404 and partial = 3 precedent rows.
- [x] 3. feat(dossier): screen state `dossier` + `selectedEndpointIds`; `useDossier` fetch when a run settles with results; VerdictMatrix header with per-verdict counts (zeros shown) and "No overall score"; rows with verdict chip, grade badge, basis, OOD warning; replaces `MatrixHandoff`.
- [x] 4. feat(dossier): expandable rows (chevron, aria-expanded, aria-controls) with SourceList; placeholder row for excipients without a fixture.
- [x] 5. feat(dossier): NovelBanner and S15; partial mode under the S06 banner (header note kept).
- [x] 6. feat(dev): switcher S07 and S15 (completed backdated runs).
- [ ] 7. test: component tests (counts, expand/collapse keyboard, legend on focus, OOD, novel banner, placeholder, partial) + e2e (S07 happy path, S15 via ALX-117, S06 partial shows 3 rows); guard test that no verdict label or fixture says "safe"; earlier tests green.

**New dependencies:** none.

## Review
—

## Tests
—

## Log
- 2026-09-19 — Loaded Build 04 · Dossier: verdict matrix. Dependencies 01 and 03 merged. Spec and image read (rows cropped at full resolution); 5 open questions.
- 2026-09-19 — start: 5 questions answered (see Decisions); plan written, 7 tasks. Status planned.
- 2026-09-19 — Tasks 1–2: fixtures typed from the image (OOD text stored without its "Out of domain:" prefix). The endpoint set is stored on the run (`endpointSet`, default null for older cookies) and decided at start (resolved name or CAS) and on identity resolve (candidate CAS or CAS override; SMILES overrides get none). `getDossier` applies the novel rule itself, so no caller can show a positive verdict for a novel excipient. The score guard caught a comment saying "no overall score"; the comment was reworded, the guard kept.
