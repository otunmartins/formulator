# Build 09 · Batch mode

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/09-batch.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Screen several excipients against one protein and compare them, reusing every Single-mode component for the dossier.

**Depends on:** Build 01, Build 03, Build 04, Build 05, Build 06, Build 07.  
**Next build:** none (last build).

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| B01 · Batch mode: CSV loaded, not run | Base: CSV loaded, not yet run. |
| B02 · Batch running | Running with aggregated progress. |
| B03 · Batch complete: comparison matrix + dossier | Comparison matrix with the first row's dossier below. |
| B04 · Batch: novel excipient row selected | The same, with the novel row selected. |

## Tasks
1. In Batch mode the input panel swaps the excipient section for a CSV dropzone, parse summary and column preview; Protein and Context are shared.
2. Validate columns (name, cas_or_smiles, conc_mg_mL, is_polymer) and report errors per row.
3. Batch progress aggregates across rows; a bad row is flagged and never blocks the others.
4. BatchMatrix: excipients × endpoints with compact chips (icon, short label, grade). Clicking a row selects it (aria-pressed) and loads its dossier below using the Build 04–07 components unchanged.

## Mock fixtures
- A 4-row batch: PS80, PS20, Poloxamer 188 and ALX-117 (novel).

## Screen details

### B01 · Batch mode: CSV loaded, not run
*Reference:* `09-batch.png`, section B01 (full page)

**How the user gets here**
- The Batch toggle in the top bar.

**What's on screen**
- The input panel swaps the excipient section for a CSV dropzone, a parsed-file summary and a column preview. The Protein and Context sections are shared with Single mode.
- Button reads "Run batch screen".

**Actions → next**

| Action | Goes to |
|---|---|
| Run batch screen | B02 |
| Single toggle | S01 |

**Notes**
- Expected columns: name, cas_or_smiles, conc_mg_mL, is_polymer. Validate them and report parse errors per row.

### B02 · Batch running
*Reference:* `09-batch.png`, section B02 (full page)

**How the user gets here**
- "Run batch screen".

**What's on screen**
- The same progress strip, aggregated across rows (for example, "4 of 4 resolved").

**Actions → next**

| Action | Goes to |
|---|---|
| All rows done | B03 |
| Any row unresolved or failing | Per-row flag in the matrix; the batch still completes |

**Notes**
- Process rows in parallel; do not block the whole batch on one bad row.

### B03 · Batch complete: comparison matrix + dossier
*Reference:* `09-batch.png`, section B03 (full page)

**How the user gets here**
- The batch finishes.

**What's on screen**
- Comparison matrix: excipients × endpoints, with compact chips (icon, short label, grade).
- The first row is selected, and its full dossier loads below: verdict matrix, liability map, simulation.

**Actions → next**

| Action | Goes to |
|---|---|
| Click an excipient row | Loads that excipient's dossier below (see B04) |

**Notes**
- The selected row is highlighted and has aria-pressed set.
- The dossier below reuses the exact Single-mode components (S07–S10).

### B04 · Batch: novel excipient row selected
*Reference:* `09-batch.png`, section B04 (full page)

**How the user gets here**
- Clicking the ALX-117 row in B03.

**What's on screen**
- The dossier heading changes to the selected excipient; the novel-excipient banner and all-Data-gap rows appear (same rule as S15).

**Actions → next**

| Action | Goes to |
|---|---|
| Click another row | Its dossier replaces this one |

## Done when
- [ ] B01–B04 match their screens.
- [ ] The dossier below the matrix uses the same components as Single mode.
- [ ] Switching back to Single keeps the single-run state intact.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
