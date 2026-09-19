# Build 03 · Run lifecycle

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/03-run-lifecycle.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Drive the progress strip from mocked step events and handle the two interruptions: unresolved identity and a failed step.

**Depends on:** Build 01, Build 02.  
**Next build:** Build 04 · Dossier: verdict matrix.

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S04 · Run in progress | Base: the progress strip mid-run with a skeleton matrix. |
| S05 · Branch: identity unresolved | Identity step needs input: candidates plus an override, and the run pauses. |
| S06 · Branch: step error | Hazard step failed: error banner and retry, with partial results kept. |

## Tasks
1. `startRun` returns a runId; the client polls `app/api/runs/[runId]/events` every 1–2 s.
2. Mock event replay on timers: identity → precedent → hazard → liability. Map each event to a step status (pending / active / done / error / needs_input) plus a one-line note.
3. Animated tick on completion (respect prefers-reduced-motion) and a skeleton verdict matrix while running.
4. Identity-unresolved card: candidate radios plus a CAS/SMILES override. "Use and continue" resumes from Precedent and records the override in the manifest.
5. Error banner with the failure reason and "Retry"; retry resumes from the failed step only, and completed results are kept.
6. Hand off to Build 04 when complete; in the error state pass only the precedent endpoints.

## Mock fixtures
- Three event scripts: happy path, identity unresolved, and hazard failure (HTTP 504).

## Screen details

### S04 · Run in progress
*Reference:* `03-run-lifecycle.png`, section S04 (full page)

**How the user gets here**
- "Run screen" (S01/S03), "Use and continue" (S05) or "Retry" (S06).

**What's on screen**
- Progress strip: Identity → Precedent → Hazard → Liability map. Done steps show an animated tick plus a one-line result; the active step shows a spinner.
- Skeleton verdict matrix: "Filling in as steps complete".

**Actions → next**

| Action | Goes to |
|---|---|
| Identity cannot be resolved | S05 |
| A step fails | S06 |
| All steps done | S07 |

**Notes**
- The backend streams step events (SSE or WebSocket): {step, status, note}.
- Sections reveal progressively: the matrix after Hazard, the liability map after Liability map.
- Motion is limited to progress ticks and section reveal; respect prefers-reduced-motion.

### S05 · Branch: identity unresolved
*Reference:* `03-run-lifecycle.png`, section S05 (full page)

**How the user gets here**
- The Identity step returns no confident match.

**What's on screen**
- Identity step shows a warning and "Needs your input"; the other steps wait.
- Card lists closest candidates (radio) and a manual CAS/SMILES override field.

**Actions → next**

| Action | Goes to |
|---|---|
| Pick a candidate or enter an override → "Use and continue" | S04, resuming at Precedent |

**Notes**
- The run is paused, not failed.
- Record the override, the user and the time in the run manifest.

### S06 · Branch: step error
*Reference:* `03-run-lifecycle.png`, section S06 (full page)

**How the user gets here**
- A step fails after retries (example: PubChem hazard lookup HTTP 504).

**What's on screen**
- The failed step is shown in red with its reason.
- Error banner with "Retry hazard step".
- The matrix shows only the completed (precedent) endpoints; the liability map and simulation are hidden.

**Actions → next**

| Action | Goes to |
|---|---|
| Retry hazard step | S04, resuming at the failed step |

**Notes**
- Keep the partial results; never discard completed steps.
- Exports are allowed for partial results, but Sign off stays disabled.

## Done when
- [ ] S04–S06 match their screens.
- [ ] An unresolved identity pauses the run rather than failing it.
- [ ] Retry does not re-run completed steps.
- [ ] Sign off stays disabled unless the run is complete.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
