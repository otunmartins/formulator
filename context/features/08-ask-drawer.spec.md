# Build 08 · Ask about this result

> Read `CLAUDE.md`, `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` and `context/00-foundation.md` first. This build is **front end only, against mocks**. The reference image is `context/screenshots/08-ask-drawer.png`: the build summary first, then each screen beside its notes, in the order listed below.

**Goal.** The right-hand drawer chat that answers only from the current dossier.

**Depends on:** Build 01, Build 04.  
**Next build:** Build 09 · Batch mode.

## Screens in this build
These screens share their components and differ only as described, so build them together.

| Screen | What's different |
|---|---|
| S11 · Ask about this result (right drawer) | Drawer open with two answered questions and their source chips. |

## Tasks
1. The drawer opens from the edge tab (Build 01) and closes with X or Esc.
2. Messages: user question, then an answer with source chips; placeholder "Answers are limited to this dossier".
3. `askDossier` server action returns canned mock answers; for anything unmatched, reply that the dossier does not cover it.
4. Scope the query by run and version, and by the session user.

## Mock fixtures
- Two canned Q&As (oxidation alert; 4 °C deamidation) and the fallback reply.

## Screen details

### S11 · Ask about this result (right drawer)
*Reference:* `08-ask-drawer.png`, section S11 (1440×900 viewport)

**How the user gets here**
- "Ask about this result" tab on the right edge (collapsed by default).

**What's on screen**
- Chat that answers only from this dossier. Every answer carries source chips.
- Input placeholder: "Answers are limited to this dossier".

**Actions → next**

| Action | Goes to |
|---|---|
| Close (X) | Back to the dossier |

**Notes**
- Retrieval is restricted to this dossier's sources and results.
- When nothing in the dossier answers the question, say so rather than using general knowledge.

## Done when
- [ ] S11 matches its screen.
- [ ] Every answer shows at least one source chip, except the "not covered" reply.
- [ ] Everything in "Acceptance that applies to every build" (foundation) holds.

## Out of scope for this build
- Anything listed in later builds; leave clean extension points instead.
- Real backend, authentication and persistence (see the foundation).
