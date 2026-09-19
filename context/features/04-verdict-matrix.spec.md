# Build 04 · Dossier: verdict matrix

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/04-verdict-matrix.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Render the endpoint-by-endpoint dossier with verdicts, evidence grades and sources, including the novel-excipient rule.

**Depends on:** Build 01, Build 03.  
**Next build:** Build 05 · Liability map.

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S07 · Run complete: verdict matrix | Base: polysorbate 80 with all four verdict types and one row expanded. |
| S15 · Variant: novel excipient for this route | The same matrix for a novel excipient: banner shown and every row a data gap. |

## Tasks
1. Header with per-verdict counts and "No overall score". Never compute or show a total.
2. Row: expand chevron (aria-expanded), endpoint + subtitle, VerdictChip, GradeBadge, basis text, and an inline out-of-domain warning on grade D rows.
3. Expanded row: list of sources with title + meta (snapshot or edition).
4. Novel-for-route rule: if `novelForRoute`, suppress Precedented and Supported verdicts for every endpoint and show the "Needs a nonclinical package" banner.
5. Partial mode (from S06): show only the endpoints that are present.

## Mock fixtures
- The PS80 × 1N8Z endpoint set (8 rows) and the ALX-117 endpoint set (8 rows).

## Screen details

### S07 · Run complete: verdict matrix
*Reference:* `04-verdict-matrix.png`, section S07 (full page)

**How the user gets here**
- All four steps are done.

**What's on screen**
- Verdict matrix: one row per endpoint, with verdict chip (icon + text), evidence badge A–E, and basis text.
- The header shows counts per verdict type. There is no overall score anywhere.
- Grade D rows carry an inline out-of-domain warning.
- The liability map and simulation card sit below (see S08–S10).

**Actions → next**

| Action | Goes to |
|---|---|
| Expand a row (chevron) | Sources list for that endpoint |
| Hover or focus a grade badge | A–E legend tooltip |
| Liability map | S08 |
| Ask about this result | S11 |
| Run manifest | S12 |
| Sign off | S13 |

**Notes**
- Verdicts: Precedented (green), Supported without precedent (teal), Data gap: test (amber), Alert: avoid (red). Never colour alone.
- Grades: A regulatory precedent at this route and level, B experimental data, C in-domain prediction, D out-of-domain/surrogate, E no data.
- Never render the word "safe" as a verdict.

### S15 · Variant: novel excipient for this route
*Reference:* `04-verdict-matrix.png`, section S15 (full page)

**How the user gets here**
- Running a screen for an excipient with no precedent at this route (example: ALX-117, PEG-b-PLGA).

**What's on screen**
- Amber banner: "Needs a nonclinical package".
- Every endpoint is Data gap (grade C, D or E); there are no positive verdicts.
- Grade D rows show out-of-domain warnings.

**Actions → next**

| Action | Goes to |
|---|---|
| Same actions as S07 | — |

**Notes**
- Rule: if there is no precedent for the route, suppress Precedented and Supported verdicts for all endpoints.

## Done when
- [ ] S07 and S15 match their screens.
- [ ] The word "safe" never appears as a verdict.
- [ ] Every verdict shows an icon + text, and the grade legend appears on hover and keyboard focus.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
