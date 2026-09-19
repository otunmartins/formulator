@AGENTS.md

# Excipient Screen

Single-page decision-support app for formulation scientists: excipient + protein in, a cited safety dossier out, plus an optional GPU compatibility simulation. It never declares anything "safe".

## Stack
Next.js (App Router) + TypeScript · PostgreSQL on Neon via Prisma (not wired yet) · Python workers for the science later (not in this repo phase).

## Current phase: front end only
- Build against mocks. All data access goes through server-only `lib/data/`; only it reads `USE_MOCKS`.
- Mutations use Server Actions (`app/actions/`); reads use Server Components; progress uses polled route handlers.
- Mock session in `lib/auth/session.ts`. Every run and workspace belongs to exactly one user; scope every query by the session, never by client-supplied IDs.
- Do not build backend pipelines, auth, persistence, exports or a project layer.

## Product rules (never break)
- Never "safe" as a verdict. Verdicts: Precedented · Supported without precedent · Data gap: test · Alert: avoid.
- No single overall score anywhere. Status is always icon + text, never colour alone.
- One screen: no routing between steps; use panels, drawers, tabs and modals.
- Footer on every state: "Decision support, not a certification of safety. Wet-lab validation required."

## Where things are
- Product context: @context/PROJECT_OVERVIEW.md
- How to work here (planning, when to ask, report template): @context/AI_INTERACTION.md
- Code conventions: @context/CODING_STANDARDS.md
- Shared reference: @context/00-foundation.md
- Builds (one at a time, in order): specs in `context/features/<NN-name>.spec.md`, reference images in `context/screenshots/<NN-name>.png`

## Working rules
- Work on one build spec at a time; don't start later builds early.
- Before finishing a build, compare the UI against that build's screens and tick its "Done when" list.
- Builds run through the `/feature` workflow (`.claude/skills/feature/SKILL.md`): `load` → `start` → `review` → `test` → `end`. Keep the tracker below current while working.

## Current build
@context/current-feature.md
