# Build 05 · Liability map

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/05-liability-map.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Show the protein's liability sites in a 3D viewer, the sequence tracks and a detail card, all kept in sync, with a temperature toggle.

**Depends on:** Build 01, Build 04.  
**Next build:** Build 07 · Review, sign-off and provenance (recommended order: 01 → 02 → 03 → 04 → 05 → 07 → 06 → 08 → 09).

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S08 · Liability map: 4 °C view, residue selected | 4 °C view with the Asn-Gly site selected. Toggling to 25 °C changes the severities. |

## Tasks
1. Viewer3D (Mol* or 3Dmol.js via `next/dynamic`, `ssr: false`; a placeholder is fine) with residues coloured by severity and a legend.
2. SequenceTrack for VH and VL in blocks of 10, with position numbers; liability residues are buttons.
3. SiteList and SiteCard (region, exposure, pathway, severity at 4 °C and 25 °C, mitigation, grade).
4. One shared `selectedSiteId` across the viewer, track and list; the 4 °C / 25 °C toggle recomputes displayed severity.
5. Severity is always text + colour.

## Mock fixtures
- 1N8Z sites: HC Met107, HC Asn55–Gly56, HC Met83, LC Met4, plus the VH/VL sequences.

## Screen details

### S08 · Liability map: 4 °C view, residue selected
*Reference:* `05-liability-map.png`, section S08 (full page)

**How the user gets here**
- Scroll down from S07.

**What's on screen**
- 3D viewer (Mol* or 3Dmol.js) with residues coloured by risk, plus a legend.
- Sequence tracks for VH and VL in blocks of 10; liability residues are highlighted and clickable.
- Side panel: site list, then a detail card (region, exposure, pathway, severity at 4 °C and 25 °C, mitigation, evidence grade).
- 4 °C / Room temp. (25 °C) toggle.
- This page also shows the simulation card in its locked state (S09).

**Actions → next**

| Action | Goes to |
|---|---|
| Click a residue in the 3D view, sequence or site list | Detail card updates; all three views stay in sync |
| Toggle temperature | Severity colours and labels update |

**Notes**
- Selection is a single shared state across the viewer, sequence and list.
- Severity is shown as text (High/Medium/Low) as well as colour.

## Done when
- [ ] S08 matches its screen.
- [ ] Selecting a site anywhere updates all three views.
- [ ] The temperature toggle changes both colour and label.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
