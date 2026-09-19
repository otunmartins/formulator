# Excipient Screen: project overview

*Working title. A focused spin-off of the Biologix excipient platform (Algonix AI).*

## 1. What it is
Excipient Screen is a single-page web app for formulation scientists. The user enters an **excipient** (name, CAS or SMILES; polymers supported) and a **protein** (PDB ID, UniProt ID, sequence or uploaded structure), plus the product context (route, dose, frequency, concentration, storage temperature). The app returns:

1. **A cited safety dossier.** For each endpoint it says what is precedented, what is a data gap, and what could go wrong, with a verdict, an evidence grade and sources.
2. **A liability map.** It shows where this specific protein is vulnerable (oxidation, deamidation and so on), with severity at 4 °C and at room temperature.
3. **An optional compatibility simulation.** A GPU molecular-dynamics run gives a protein-specific interaction signal against a known stabiliser and an inert control.

It is **decision support**. It triages evidence and never certifies anything as "safe"; wet-lab validation is always required.

## 2. Who it is for
Formulation and pre-formulation scientists in biologics development, and the reviewers who sign off their assessments. Typical questions:
- "Can I use this excipient, at this level, by this route?"
- "What should I test first?"
- "What will this excipient do to my protein?"

## 3. Why it matters
Excipient choice for a biologic depends on scattered evidence: regulatory databases, compendia, literature, and knowledge of the protein's own weak spots. Scientists assemble it by hand, and it is easy to miss an interaction, such as peroxides in a surfactant oxidising an exposed methionine in a CDR. Excipient Screen puts the evidence, the gaps and the protein-specific risks on one screen, with the grade of evidence behind every statement.

## 4. Core concepts
| Concept | Meaning |
|---|---|
| **Verdict** (per endpoint) | Precedented · Supported without precedent · Data gap: test · Alert: avoid. There is no overall score. |
| **Evidence grade** | A regulatory precedent at this route and level · B experimental data · C in-domain prediction · D out-of-domain or surrogate prediction · E no data |
| **Novel excipient for this route** | No precedent at the route: no positive verdicts, and a "Needs a nonclinical package" banner |
| **Liability site** | A residue at risk (e.g. Met oxidation, Asn-Gly deamidation), with pathway, severity at 4 °C and 25 °C, and mitigation |
| **Compatibility simulation** | Optional GPU MD: preferential interaction coefficient (Γ23) vs sucrose and a buffer-only control, per-residue contact occupancy, trajectory |
| **Run / version / sign-off** | Each screen is a run. A reviewer signs off a version, which makes it read-only; changes create a new version. |
| **Run manifest** | Inputs, tool versions, database snapshot dates and model versions, for reproducibility |

## 5. Main user journeys
1. **Single screen.** Enter excipient, protein and context → run (Identity → Precedent → Hazard → Liability map) → review the dossier → optionally run the simulation → ask questions of the dossier → sign off → export.
2. **Batch screen.** Upload a CSV of excipients → run → compare excipients across endpoints → open any excipient's full dossier.
3. **Exceptions.**
   - Identity unresolved: pick a candidate or override, then the run resumes.
   - A step fails: retry from that step, keeping partial results.
   - Novel excipient: all endpoints are data gaps.

## 6. Scope
**In scope (v1):**
- one screen with Single and Batch modes
- dossier, liability map, optional simulation
- dossier-limited Q&A
- sign-off and versioning, run manifest, exports
- private per-user workspaces

**Not in scope (for now):**
- landing or marketing pages, pricing, team management, settings screens
- a project layer between workspace and run
- sharing between users (the share link is undecided)
- any single "safety score"

## 7. Principles
- Never say "safe". Show verdicts and evidence grades, never a total.
- Every claim traces to a source or a named model version.
- Show uncertainty openly: out-of-domain predictions are flagged inline.
- Status is always icon + text, never colour alone. Keyboard-accessible.
- Calm, dense, scientific interface: one accent colour, IBM Plex Sans/Mono.

## 8. Architecture
**Stack:**
- Next.js (App Router) + TypeScript
- PostgreSQL on Neon via Prisma
- Python workers in Docker for the science (RDKit, OpenMM, PDBFixer, FreeSASA), on AWS EC2: CPU for screening, GPU on demand for simulation

**Division of work:**
- **Next.js:** UI, authentication, workspaces, runs, versions, sign-off, manifest, exports, dossier Q&A (LLM API with retrieval limited to the dossier), and job creation.
- **Python workers:** identity canonicalisation, precedent and hazard pipelines, liability modelling, and the OpenMM simulation.
- **Hand-off through Postgres.** Next.js writes a job row; a worker claims it (`FOR UPDATE SKIP LOCKED`), writes step events and results back, and the UI polls. There is no message broker.
- **FastAPI is not needed initially.** Add it only if an interactive action needs Python synchronously.
- **The simulation is optional.** The dossier and liability map work without it, so a CPU-only deployment is a valid tier.

**Ownership:** every workspace belongs to exactly one user, and every run belongs to one workspace. Nothing is shared between users. Every data access is scoped by the signed-in user's session.

## 9. Delivery plan
**Phase 1 (current): front end.** The full UI, built in 9 builds against mock data, through a single server-side data layer (`lib/data/`, `USE_MOCKS=true`) with a mock session:

| Build | Scope |
|---|---|
| 01 | App shell (common to every screen): setup, tokens, shared components, data seam and mocks, top bar and menus, empty state |
| 02 | Inputs panel: excipient, polymer fields, protein tabs, context (structure editor removed 2026-09-19) |
| 03 | Run lifecycle: progress, identity-unresolved and error branches |
| 04 | Dossier: verdict matrix, sources, grades, novel-excipient rule |
| 05 | Liability map: 3D viewer, sequence tracks, site card, temperature toggle |
| 06 | Compatibility simulation: locked, running and complete |
| 07 | Review and provenance: sign-off, versions, manifest, export stubs |
| 08 | Ask about this result (dossier-limited chat) |
| 09 | Batch mode: CSV, comparison matrix, reused dossier |

**Later phases (order to be decided):**
- authentication and persistence (Prisma schema on Neon)
- the Python worker with identity, precedent and hazard pipelines
- liability models
- the GPU simulation service
- real dossier Q&A
- PDF/DOCX exports
- a decision on share links
- possibly projects

## 10. Open decisions
- Share links: whether to offer them without breaking per-user isolation (e.g. a read-only link to a signed version).
- A project layer: deferred, to be added later.
- FastAPI: only if a synchronous Python call becomes necessary.
- Data sources and licensing for the precedent and hazard databases, and their snapshot cadence.
- Applicability domains for each prediction model (these decide when grade D is used).

## 11. Documents in this kit
- `CLAUDE.md`: rules Claude Code loads every session
- `context/PROJECT_OVERVIEW.md`: this file
- `context/AI_INTERACTION.md`: how Claude Code works in this repo, and the rules for the in-app dossier Q&A
- `context/CODING_STANDARDS.md`: code conventions for every build
- `context/00-foundation.md`: the technical reference shared by every build (tokens, state model, data contract, ownership, later architecture)
- `context/features/<NN-name>.spec.md`: per-build spec, with its reference image at `context/screenshots/<NN-name>.png`
- `context/current-feature.md` and `context/feature-log.md`: the active build tracker and build history, maintained by the `/feature` workflow
