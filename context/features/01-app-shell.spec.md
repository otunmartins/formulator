# Build 01 · App shell (common to every screen)

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/01-app-shell.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Build the frame every other build plugs into: project setup, tokens, shared UI primitives, the data seam with mocks and a mock session, and the empty screen. When this build is done, the app runs end to end with no results yet.

**Depends on:** nothing (this is the first build).  
**Next build:** Build 02 · Inputs panel.

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S01 · New screen (empty) | Base: the empty screen with every region in place. |
| C01 · Recent runs dropdown | Same shell with the Recent runs menu open. |
| C02 · User and workspace menu | Same shell with the user/workspace menu open. |
| C03 · Input panel collapsed | Same shell with the input panel collapsed. |

## Tasks
1. Next.js App Router + TypeScript; single route `app/page.tsx`; IBM Plex Sans/Mono via `next/font`; design tokens as CSS variables.
2. Shared primitives, used by every later build: Button, IconButton, Segmented, Tabs, Card, Chip, VerdictChip (4 variants, icon + text), GradeBadge with an A–E legend on hover **and** focus, Modal (focus trap, Esc), Drawer, Menu, and one icon set.
3. Layout regions: sticky top bar; sticky, collapsible input panel (container, section headings and Run button only; fields come in Build 02); main column with run header; ProgressStrip showing all four steps as "Waiting"; empty-state card; sticky review bar (status chip "Draft", all actions disabled); fixed footer disclaimer; "Ask about this result" edge tab (drawer body comes in Build 08).
4. Top bar: the Single | Batch toggle switches mode state (Batch content comes in Build 09); the Recent runs menu reads `listRecentRuns()`; the user menu lists the session user's own workspaces, and switching reloads the recent runs.
5. Data seam: `lib/data/` (server-only), `lib/mocks/`, the `USE_MOCKS` env var, the mock session in `lib/auth/session.ts`, an `app/actions/` skeleton, and polling route handler stubs.
6. Dev-only state switcher (hidden in production) for jumping between steps as later builds add them.
7. Tablet breakpoint: the panel narrows at ≤1180px and can collapse.

## Mock fixtures
- A session user with two workspaces.
- Recent runs for each workspace (the list must change when the workspace changes).

## Screen details

### S01 · New screen (empty)
*Reference:* `01-app-shell.png`, section S01 (full page)

**How the user gets here**
- App opens with no run, or the user starts a new screen.

**What's on screen**
- Top bar: product name, Single | Batch toggle, Recent runs, user/workspace menu.
- Left input panel (sticky, collapsible): Excipient, Protein, Context, "Run screen".
- Progress strip with all four steps "Waiting".
- Empty card with "Load example" button.
- Review bar: Export and Share are disabled until results exist; Sign off is disabled until the run is complete.
- Persistent footer disclaimer.

**Actions → next**

| Action | Goes to |
|---|---|
| ~~Draw structure~~ | Removed 2026-09-19 (no structure editor) |
| Protein tab or Polymer switch | S03 |
| Run screen / Load example | S04 |
| Batch toggle | B01 |
| Recent runs | C01 |
| User menu | C02 |
| Collapse panel | C03 |

**Notes**
- Excipient field accepts name, CAS or SMILES; resolve identity on blur and show the resolved name + CAS under the field.
- Context defaults: route SC, storage 25 °C.
- The Run button is the only primary (accent) action in the input panel.

### C01 · Recent runs dropdown
*Reference:* `01-app-shell.png`, section C01 (1440×900 viewport)

**How the user gets here**
- "Recent runs" in the top bar.

**What's on screen**
- List of recent runs: title, run ID, time and status chip (Draft / Signed off vN).

**Actions → next**

| Action | Goes to |
|---|---|
| Click a run | Loads that run into this same screen (no page change) |

**Notes**
- There is no separate results page: everything loads into the one screen.

### C02 · User and workspace menu
*Reference:* `01-app-shell.png`, section C02 (1440×900 viewport)

**How the user gets here**
- Avatar/name in the top bar.

**What's on screen**
- Workspace switcher (only the signed-in user's own workspaces) and Sign out.

**Actions → next**

| Action | Goes to |
|---|---|
| Switch workspace | Reloads Recent runs and data for that workspace, still only this user's |

**Notes**
- Every workspace and run belongs to exactly one user; nothing is shared between users.
- This phase uses a mock session (lib/auth/session.ts); real auth replaces only that file.
- Login and admin screens are out of scope for this screen.

### C03 · Input panel collapsed
*Reference:* `01-app-shell.png`, section C03 (1440×900 viewport)

**How the user gets here**
- Collapse icon in the input panel header.

**What's on screen**
- The panel shrinks to a thin rail; results use the full width.

**Actions → next**

| Action | Goes to |
|---|---|
| Expand icon | Panel restored |

**Notes**
- At tablet widths, default to collapsed after a run completes.

## Done when
- [ ] S01 and C01–C03 match their screens.
- [ ] Every interactive element can be reached and used with the keyboard, with visible focus.
- [ ] Components never import mocks or Prisma; only `lib/data/` reads `USE_MOCKS`.
- [ ] Every `lib/data/` function scopes by the session user and workspace.
- [ ] The footer disclaimer is visible in every state.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
