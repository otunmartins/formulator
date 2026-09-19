# Excipient Screen: foundation (shared by every build)

A single-page web app for formulation scientists. The user enters an excipient and a protein and gets a cited safety dossier, plus an optional GPU protein-compatibility simulation. It is decision support: it triages what is precedented, what is a data gap, and what could go wrong for that protein. It never declares anything "safe".

**How to use this file.** This is the shared reference for all builds: scope, stack, ownership, rules, tokens, state model and data contract. Each build has a spec in `context/features/` and one reference image in `context/screenshots/`, and those specs assume you have read this file and `context/PROJECT_OVERVIEW.md`.

## Scope of this phase: front end only, backend comes later
Build the complete UI and all its states now. **Do not build the backend in this phase.** The following will be built later and must not be implemented, stubbed with real logic, or guessed at:
- identity resolution (PubChem, ChEBI, excipient registry)
- precedent and hazard lookups (FDA IID, EMA, compendia, literature)
- liability modelling (SASA, deamidation and oxidation models, structure prediction)
- the GPU compatibility simulation (OpenMM jobs, queue, workers)
- Ask-drawer retrieval and model calls
- exports (PDF/DOCX generation), share links and persistence of runs, versions and sign-off
- real authentication (login, sessions); this phase uses a mock session, but the ownership scoping is built now

Instead:
- **Mock data layer.** Put fixtures in `lib/mocks/` that match the data contract below exactly. Include: PS80 × 1N8Z complete, novel excipient (ALX-117), identity unresolved, error at the hazard step, and the 4-row batch.
- **One data seam.** Put all data access in a server-only module, `lib/data/` (import `server-only`), with typed functions. Components never read mocks or the database directly.
  - Mutations are exposed as **Server Actions** in `app/actions/`: `startRun`, `resolveIdentity` (override), `startSimulation`, `cancelSimulation`, `askDossier`, `signOff`, `newVersion`, `exportDossier`.
  - Reads come from **Server Components** (`getDossier`, `getManifest`, `listRecentRuns`, `getBatch`).
  - Live progress comes from **Route Handlers** that the client polls every 1–2 s: `app/api/runs/[runId]/events/route.ts` and `app/api/simulations/[jobId]/route.ts`. Use polling rather than long-lived streams so it works on serverless hosting.
  - For now every function in `lib/data/` returns mock data.
- **Simulated timing.** `subscribeRunEvents` and `getSimulationStatus` replay mock events on timers, so the progress strip and simulation stepper behave as they will live.
- **Mock switch.** Add a server-side env var `USE_MOCKS=true` (no `NEXT_PUBLIC_` prefix; only `lib/data/` reads it). It chooses between mocks now and Prisma/worker calls later, with no component changes.
- **State preview.** Add a dev-only state switcher (hidden in production) to jump to any step S01–C03 for review.
- **Client-only libraries.** Load the 3D viewer and trajectory viewer as client components with `next/dynamic` and `ssr: false`.
- **Placeholder viewers.** Use placeholders for the 3D protein viewer and trajectory viewer unless a library drops in cleanly. Keep their props shaped for the real data (structure ID, sites, selection, frames).
- **Visible stubs.** Buttons for later features (Export PDF/DOCX, Copy share link) work in the UI but call the stub and show a brief "Not connected yet" notice. They must not fail silently.

Where a step's build notes below mention the backend (streamed events, job queue, retrieval, immutable manifest), treat that as the contract the mock must imitate, not as work to do now.

## Tech stack
- **Next.js (App Router) + TypeScript.** Single route `app/page.tsx`. The screen is one client shell; all state changes happen in place, with no navigation between steps.
- **PostgreSQL on Neon via Prisma.** Not wired in this phase, apart from an optional draft `prisma/schema.prisma` that mirrors the data contract (do not run migrations yet). Later, use Neon's pooled connection string and the Prisma Neon adapter for serverless.
- **Python services later.** The science stack (RDKit, OpenMM, PDBFixer, FreeSASA) runs in separate Python worker(s), not in Next.js. See "Later: backend architecture" at the end of this file. Nothing in this phase depends on them.

## Ownership and data isolation (applies now, enforced for real later)
- **Everything belongs to one user.** Every workspace belongs to exactly one user. Every run (and its versions, events, results, simulations, sign-offs and manifest) belongs to one workspace, and so to that user. No data is shared between users.
- **Every read and write is scoped.** Every function in `lib/data/` takes its scope from the current session (`userId`, active `workspaceId`), never from client input. A user can never load, list, change or ask about another user's run, even by guessing an ID. Scope every lookup by owner, never by ID alone.
- **Mock session in this phase.** Use a mock session (`lib/auth/session.ts` returning a fixed user and workspace) so the scoping code paths exist now. Real authentication replaces only that file later.
- **Workspace switcher.** A user can have several workspaces, all their own. Switching changes which runs appear in Recent runs and the batch list.
- **Share link.** "Copy share link" stays a stub. Sharing would break isolation, so it needs its own decision later (for example a read-only link to a signed version).
- **Projects are out of scope.** Do not add a project layer between workspace and run.

## Hard rules
- One screen. No routing, landing page, login/admin, settings, pricing or separate results pages. Use panels, drawers, tabs and modals.
- Never render the word "safe" as a verdict. Use only the four verdict labels below.
- No single overall score anywhere.
- All status is conveyed by text plus icon, never colour alone.
- Keyboard-navigable throughout: real `<button>`/`<input>`/`<label>`, visible focus, modals trap focus and close on Esc.
- Motion only for progress ticks and section reveal; honour `prefers-reduced-motion`.
- Persistent footer on every state: "Decision support, not a certification of safety. Wet-lab validation required."
- Desktop-first (1280–1440), responsive to tablet (the input panel collapses).
- Multi-user with strict per-user isolation (see Ownership above). Login screens are out of scope for this screen; use the mock session.

## Layout skeleton
```
┌ Top bar (56px, sticky): name · [Single|Batch] · Recent runs ▾ · user/workspace ▾ ┐
├ Left input panel (344px, sticky, collapsible) ┬ Main column (one scroll)            ┤
│  Excipient / Protein / Context / Run          │  Run header                         │
│  (Batch: CSV upload + preview)                │  a. Progress strip                  │
│                                               │  b. Verdict matrix (Batch: matrix)  │
│                                               │  c. Liability map                   │
│                                               │  d. Compatibility simulation        │
│                                               │  e. Review & export bar (sticky)    │
├───────────────────────────────────────────────┴─────────────────────────────────────┤
│ Right drawer "Ask about this result" (collapsed by default, tab on right edge)      │
└ Footer disclaimer (fixed, 30px) ────────────────────────────────────────────────────┘
```

## Design tokens
| Token | Value |
|---|---|
| Font UI | IBM Plex Sans 400/500/600/700 |
| Font data (SMILES, sequences, IDs, versions) | IBM Plex Mono 400/500/600 |
| Background / surface | `#F4F5F7` / `#FFFFFF` |
| Border / strong border | `#DDE1E6` / `#C4CAD2` |
| Text / muted | `#16191D` / `#535B66` |
| Accent (single) | `#2B4C9B` |
| Radius | cards 10px, inputs/buttons 6px, chips 13px |
| Spacing | generous in input panel (22–24px groups), compact tables in results |

Verdict chips (icon + text):
| Verdict | Text | Fill | Border | Icon |
|---|---|---|---|---|
| Precedented | `#17663A` | `#E8F4EC` | `#B7DEC4` | circle-check |
| Supported without precedent | `#0B6466` | `#E3F2F2` | `#AEDADB` | dashed circle-check |
| Data gap: test | `#7A4A00` | `#FCF0D8` | `#EFCB85` | flask |
| Alert: avoid | `#A51D14` | `#FCEAE8` | `#F2B8B2` | triangle alert |

Evidence grades (mono badge, legend on hover **and** focus):
A regulatory precedent at this route and level · B experimental data · C in-domain prediction · D out-of-domain or surrogate prediction · E no data.

Residue risk: High `#C62D1F`, Medium `#D98A00`, Low `#7D8A99`, always with the text label.

## Component inventory
TopBar, ModeToggle, RecentRunsMenu, UserMenu · InputPanel (ExcipientField, PolymerFields, ProteinTabs, ContextFields, RunButton, BatchCsvInput) · RunHeader · ProgressStrip · VerdictMatrix (VerdictRow, VerdictChip, GradeBadge+Legend, SourceList, OodWarning) · BatchMatrix · NovelBanner · IdentityResolver · ErrorBanner · LiabilityMap (Viewer3D, SequenceTrack, SiteList, SiteCard, TempToggle) · SimulationCard (Locked, Running stepper, Complete: GammaChart, OccupancyStrip, TrajectoryViewer) · ReviewBar (StatusChip, SignOffModal, Export, ShareLink, ManifestDrawer) · AskDrawer · Footer.

## State model
```ts
type Mode = 'single' | 'batch'
type RunState = 'empty' | 'running' | 'identity_unresolved' | 'error' | 'complete'
type StepStatus = 'pending' | 'active' | 'done' | 'error' | 'needs_input'
type Steps = Record<'identity'|'precedent'|'hazard'|'liability', {status: StepStatus; note?: string}>
type SimState = 'locked' | 'running' | 'complete'
type Review = { status: 'draft' | 'signed'; version: number; signedBy?: string; signedAt?: string }
UI: { selectedEndpointIds: Set<string>; selectedSiteId: string; temp: '4'|'25';
      batchSelectedId?: string; drawer: 'ask'|'manifest'|null; modal: 'signoff'|null;
      panelCollapsed: boolean }
```
Rules:
- A novel excipient (no precedent for the route) forces every endpoint to `gap` and shows NovelBanner.
- `review.status === 'signed'` disables every input and the Run and Simulate buttons; "Edit as new version" creates version+1 as a draft.
- Sign off is enabled only when `RunState === 'complete'`.

## Data contract (suggested; the mocks must follow it)
```json
{
  "runId": "RUN-2026-0918-0412",
  "input": { "excipient": {"query":"Polysorbate 80","cas":"9005-65-6","smiles":null,
             "polymer":{"repeatUnit":"-(CH2CH2O)-","endGroups":"...","dp":"≈20","residualMonomers":["ethylene oxide","1,4-dioxane"]}},
             "protein": {"source":"pdb","id":"1N8Z","chains":["A","B"],"excludedChains":["C"]},
             "context": {"route":"SC","dose":{"value":150,"unit":"mg"},"frequency":"q2w","conc_mg_mL":0.2,"storage_C":25} },
  "steps": { "identity":{"status":"done","note":"..."}, "precedent":{}, "hazard":{}, "liability":{} },
  "novelForRoute": false,
  "endpoints": [ { "id":"perox","name":"Peroxide impurities → Met oxidation","subtitle":"This Fab",
                   "verdict":"alert","grade":"B","basis":"...","ood":null,
                   "sources":[{"title":"...","meta":"Snapshot 2026-07-01"}], "step":"hazard" } ],
  "liability": { "structure":"1N8Z", "sites":[ {"id":"HM107","chain":"H","positions":[107],"label":"HC Met107",
                 "kind":"Oxidation","region":"CDR-H3","exposure":"...","pathway":"...",
                 "severity":{"4":"Medium","25":"High"},"grade":"C","mitigation":"..."} ],
                 "sequences":{"H":"EVQL...","L":"DIQM..."} },
  "simulation": { "state":"complete","gpuHours":17.6,
                  "gamma23":[{"label":"Polysorbate 80","mean":-1.8,"sd":0.6},{"label":"Sucrose","mean":-4.1,"sd":0.5},{"label":"Buffer only","mean":0.2,"sd":0.3}],
                  "occupancy":[{"res":"H·W99","frac":0.81}], "trajectory":{"replicates":3,"frames":1000} },
  "ownerId": "usr_…", "workspaceId": "wsp_…",
  "review": { "status":"draft","version":1 },
  "manifest": { "inputs":{}, "tools":{"RDKit":"2025.09.1","OpenMM":"8.2.0"}, "databases":{"FDA IID":"2026-07-01"}, "models":{} }
}
```
Protein sources (added 2026-09-19): `{source:"pdb", id, chains, excludedChains}` · `{source:"uniprot", id}` · `{source:"sequence", fasta}` · `{source:"upload", fileName, format:"pdb"|"mmcif"}`. Only the active source is sent; Phase 1 uploads send file metadata only.

Endpoint `step` (added 2026-09-19, Build 04): `"precedent" | "hazard"`, the run step that produced it. After a failed step, the matrix shows only endpoints from completed steps.

No structure editor (removed 2026-09-19): the excipient is entered as a name, CAS or SMILES.

Batch: `{ "rows":[{ "id","name","identifier","conc", "endpoints":[...] }], "selectedId" }`. The dossier below the matrix renders the same objects as Single mode.

## Builds (in order)
Similar screens are merged into one build. Build 01 is the shell that every later build plugs into, so build it first. After that, follow the order below: each build lists what it depends on.

| Build | Spec | Screens | Depends on |
|---|---|---|---|
| 01 · App shell (common to every screen) | `context/features/01-app-shell.spec.md` | S01, C01, C02, C03 | — |
| 02 · Inputs panel | `context/features/02-inputs.spec.md` | S03 (S02 removed) | 01 |
| 03 · Run lifecycle | `context/features/03-run-lifecycle.spec.md` | S04, S05, S06 | 01, 02 |
| 04 · Dossier: verdict matrix | `context/features/04-verdict-matrix.spec.md` | S07, S15 | 01, 03 |
| 05 · Liability map | `context/features/05-liability-map.spec.md` | S08 | 01, 04 |
| 06 · Compatibility simulation | `context/features/06-simulation.spec.md` | S09, S10 | 01, 04 |
| 07 · Review, sign-off and provenance | `context/features/07-review-provenance.spec.md` | S13, S14, S12 | 01, 04 |
| 08 · Ask about this result | `context/features/08-ask-drawer.spec.md` | S11 | 01, 04 |
| 09 · Batch mode | `context/features/09-batch.spec.md` | B01, B02, B03, B04 | 01, 03, 04, 05, 06, 07 |

## Acceptance that applies to every build
- [ ] The build's screens match their reference images in layout and copy.
- [ ] No backend logic: data goes through `lib/data/` and returns mocks; flipping `USE_MOCKS` touches only `lib/data/`.
- [ ] Every `lib/data/` function scopes by the session user and workspace; none accepts an owner or workspace ID from the client.
- [ ] Never "safe" as a verdict, no overall score, and status is never shown by colour alone.
- [ ] Keyboard-navigable with visible focus; honours prefers-reduced-motion.
- [ ] The footer disclaimer is visible; no project layer exists.
- [ ] Stubbed actions show "Not connected yet" rather than failing silently.
- [ ] Nothing from a later build is started early.

---

## Later: backend architecture (context only, do not build in this phase)
- **Next.js owns:** the UI, auth, users/workspaces, runs, versions, sign-off, manifest records, exports, share links, Ask (calls the LLM API with retrieval restricted to the dossier), and job creation.
- **Python worker(s) own:** identity canonicalisation, precedent/hazard pipelines, liability modelling (CPU), and the OpenMM compatibility simulation (GPU, hours per job). Delivered as Docker images.
- **The job hand-off is Postgres itself:**
  - Next.js inserts a `Job` row.
  - The worker claims jobs with `SELECT … FOR UPDATE SKIP LOCKED`.
  - The worker writes `RunEvent` rows (step, status, note) and the results back to Neon.
  - The polling route handlers read those rows.
  - This needs no message broker and no FastAPI.
- **FastAPI is optional:** add it only if an interactive synchronous call needs Python and cannot wait for a job (for example RDKit validation on blur). Until then, identity lookups can call PubChem from a server action.
- **Suggested Prisma models later:** `User`, `Workspace` (`ownerId` → User), `Run` (`workspaceId`, `ownerId`; index both), `RunVersion`, `RunEvent`, `Endpoint`, `Source`, `LiabilitySite`, `SimulationJob`, `Manifest`, `SignOff`, `BatchRow`.
