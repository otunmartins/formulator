# Build 02 · Inputs panel

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/02-inputs.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** Fill the input panel for Single mode: excipient with identity hint, the structure editor, polymer fields, protein source tabs and context.

**Depends on:** Build 01.  
**Next build:** Build 03 · Run lifecycle.

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S03 · Input variants: Polymer fields and Protein tabs | Base: the full panel, with the Sequence tab and polymer fields showing. |
| S02 · Draw structure modal | The same panel with the Draw structure modal open. |

## Tasks
1. Excipient field (name, CAS or SMILES) with a resolved-identity hint under it; `resolveIdentity` is mocked.
2. Draw structure modal: embed Ketcher or JSME through `next/dynamic` with `ssr: false` (a placeholder is fine if it won't drop in cleanly). "Use structure" writes the SMILES into the field.
3. Polymer switch revealing repeat unit, end groups, approx. DP and residual monomers.
4. Protein tabs: PDB ID (plus chain chips; the antigen chain can be excluded), UniProt ID, Sequence (FASTA), Upload (PDB/mmCIF). Only the active tab is submitted.
5. Context: route SC/IV/IM, dose + unit, frequency, excipient concentration, storage 4/25/40 °C.
6. Client-side validation with inline errors; the whole panel can be disabled (used by Build 07).

## Mock fixtures
- Identity results: Polysorbate 80 (resolved) and ALX-117 (user SMILES, no registry match).

## Screen details

### S03 · Input variants: Polymer fields and Protein tabs
*Reference:* `02-inputs.png`, section S03 (1440×900 viewport)

**How the user gets here**
- Polymer switch or a Protein tab in the input panel.

**What's on screen**
- Polymer switch ON reveals: repeat unit (mono), end groups, approx. DP, residual monomers.
- Protein tabs: PDB ID (plus chain chips; the antigen chain can be excluded), UniProt ID, Sequence (FASTA textarea), Upload (PDB/mmCIF dropzone).
- Context: route SC/IV/IM, dose + unit, frequency, excipient concentration, storage 4/25/40 °C.

**Actions → next**

| Action | Goes to |
|---|---|
| Run screen | S04 |

**Notes**
- Only one protein source is active at a time; the active tab decides what is sent.
- UniProt/Sequence input means a predicted structure: tag the liability map with grade C.
- Use monospace for SMILES, sequences and IDs.

### S02 · Draw structure modal
*Reference:* `02-inputs.png`, section S02 (1440×900 viewport)

**How the user gets here**
- "Draw structure" button next to the Excipient field (S01).

**What's on screen**
- Modal with a toolbar (Bond / Chain / Ring / Erase, element picker, Undo), a drawing canvas and a live SMILES field.

**Actions → next**

| Action | Goes to |
|---|---|
| Use structure | S01 (Excipient field filled with the SMILES) |
| Cancel or X | S01, unchanged |

**Notes**
- Embed an existing editor (Ketcher or JSME); do not build one.
- For polymers the user draws the repeat unit; end groups and DP stay in the Polymer fields.
- Trap focus inside the modal; Esc closes it; return focus to the button.

## Done when
- [ ] S02 and S03 match their screens.
- [ ] Monospace is used for SMILES, sequences and IDs.
- [ ] The modal traps focus, closes on Esc and returns focus to "Draw structure".
- [ ] Pressing Run calls the `startRun` server action with the typed input.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
