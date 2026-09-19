# Build 07 · Review, sign-off and provenance

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/07-review-provenance.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Close the loop on a dossier: sign-off, read-only signed versions, new versions, the run manifest, and export/share stubs.

**Depends on:** Build 01, Build 04.  
**Next build:** Build 06 · Compatibility simulation (recommended order: 01 → 02 → 03 → 04 → 05 → 07 → 06 → 08 → 09).

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S13 · Sign-off modal | Sign-off modal over the complete dossier. |
| S14 · Signed off (read-only) | Signed off: banner, read-only inputs, "Edit as new version". |
| S12 · Run manifest drawer | Run manifest drawer. |

## Tasks
1. Review bar: status chip (Draft / Draft vN / Signed off vN), Sign off (enabled only when complete), Run manifest link, Export PDF, Export DOCX, Copy share link.
2. Sign-off modal: summary chips (alerts, data gaps, D/E rows), required comment and acknowledgement checkbox; `signOff` locks the version.
3. Signed state: green banner with signer and time; disable the Build 02 panel, Run, and Run simulation.
4. "Edit as new version": `newVersion` creates Draft v(n+1), and inputs become editable again.
5. Manifest drawer: grouped key-value tables (inputs, tool versions, database snapshots, model versions) from `getManifest`.
6. Export and share are stubs that show a "Not connected yet" notice.

## Mock fixtures
- Manifest for the PS80 run, and review state transitions for v1 → signed → v2.

## Screen details

### S13 · Sign-off modal
*Reference:* `07-review-provenance.png`, section S13 (1440×900 viewport)

**How the user gets here**
- "Sign off" in the review bar (enabled only when the run is complete).

**What's on screen**
- Explains that signing locks the dossier and records a review, not approval for use.
- Summary chips: number of Alerts, Data gaps, and grade D/E rows.
- Review comment field and an acknowledgement checkbox.

**Actions → next**

| Action | Goes to |
|---|---|
| Sign off v1 | S14 |
| Cancel | S07 |

**Notes**
- Require both the comment and the checkbox before enabling the confirm button.

### S14 · Signed off (read-only)
*Reference:* `07-review-provenance.png`, section S14 (full page)

**How the user gets here**
- Confirming the sign-off in S13.

**What's on screen**
- Green "Signed off v1 · read-only" banner with signer name and time.
- Inputs are disabled; the Run button and Run simulation are disabled.
- Status chip reads "Signed off v1".

**Actions → next**

| Action | Goes to |
|---|---|
| Edit as new version | S07 as "Draft v2" (inputs editable again) |

**Notes**
- Signed versions are immutable; editing forks a new draft version.
- Exports and the share link still work.

### S12 · Run manifest drawer
*Reference:* `07-review-provenance.png`, section S12 (1440×900 viewport)

**How the user gets here**
- "Run manifest" link in the review bar.

**What's on screen**
- Grouped key-value tables: Inputs, Tool versions, Database snapshot dates, Model versions.

**Actions → next**

| Action | Goes to |
|---|---|
| Close (X) | Back to the dossier |

**Notes**
- The manifest is written by the backend at run time and is immutable per version.

## Done when
- [ ] S12–S14 match their screens.
- [ ] Signed versions cannot be edited.
- [ ] Stubbed actions never fail silently.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
