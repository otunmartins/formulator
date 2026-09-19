# Build 06 · Compatibility simulation

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/06-simulation.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** The optional GPU simulation card with all three states: locked, running and complete.

**Depends on:** Build 01, Build 04.  
**Next build:** Build 08 · Ask about this result (recommended order: 01 → 02 → 03 → 04 → 05 → 07 → 06 → 08 → 09).

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S09 · Compatibility simulation: locked → running | Running stepper; the locked state is visible in the S08 screen. |
| S10 · Compatibility simulation: complete | Complete: Γ23 chart, contact occupancy and the trajectory viewer. |

## Tasks
1. Locked: description, GPU-hour estimate, hardware, protocol, wall time, caveat and the Run button (`startSimulation`).
2. Running: poll `app/api/simulations/[jobId]`; stepper Queued → Building → Minimising → Equilibrating → Production replicate n of 3 → Analysing; remaining time; Cancel (`cancelSimulation`) returns to locked.
3. Complete: Γ23 bar chart (mean ± SD error bars; excipient vs sucrose vs buffer only; note that negative means excluded), a top-16 occupancy strip, and the trajectory viewer (play, frame slider, replicate select).
4. The simulation never blocks the dossier or sign-off; it is disabled when signed off.

## Mock fixtures
- A job status replay through all steps, and the completed result values shown in S10.

## Screen details

### S09 · Compatibility simulation: locked → running
*Reference:* `06-simulation.png`, section S09 (full page)

**How the user gets here**
- "Run compatibility simulation" on the locked card (visible in S08).

**What's on screen**
- Locked state (see S08): short description, GPU-hour estimate, hardware, protocol, wall time, caveat, Run button.
- Running state (this page): stepper Queued → Building system → Minimising → Equilibrating → Production replicate n of 3 → Analysing, plus remaining time, job ID and Cancel.

**Actions → next**

| Action | Goes to |
|---|---|
| Cancel | Locked state |
| Job finishes | S10 |

**Notes**
- This is an async GPU job (queue + worker); the UI polls or subscribes to job status.
- The run is optional and never blocks the dossier or sign-off.

### S10 · Compatibility simulation: complete
*Reference:* `06-simulation.png`, section S10 (full page)

**How the user gets here**
- The simulation job finishes.

**What's on screen**
- Bar chart of the preferential interaction coefficient Γ23: the excipient vs a known stabiliser (sucrose) vs an inert control (buffer only), mean ± SD over 3 replicates.
- Per-residue contact-occupancy strip (top 16 residues).
- Trajectory viewer with play, frame slider and replicate picker.
- Caveat line: this is a screening signal and does not predict shelf life.

**Actions → next**

| Action | Goes to |
|---|---|
| Scrub frames / switch replicate | Trajectory viewer updates |

**Notes**
- Negative Γ23 means the additive is excluded from the protein surface; state this beside the chart.
- Show GPU-hours used in the card header.

## Done when
- [ ] S09 and S10 match their screens (and the locked card in S08).
- [ ] Cancel works mid-run.
- [ ] GPU-hours used appear in the card header when complete.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
