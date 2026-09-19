---
name: feature
description: Spec-driven build workflow for this repo. Subcommands new, load, start, status, review, test, end. Tracks the active build in context/current-feature.md. Use only when the user runs /feature.
argument-hint: "[new <NN-name> | load <NN-name> | start | status | review | test | end]"
disable-model-invocation: true
---

# /feature workflow

Arguments: `$ARGUMENTS`

The first word is the subcommand. Everything after it is its argument. With no arguments, run `status`.

This skill runs the build loop that `context/AI_INTERACTION.md` Part A describes. Where this file and that one differ, follow `AI_INTERACTION.md`, and follow its sources-of-truth order (A4).

## Files

| Path | Purpose |
|---|---|
| `context/features/<NN-name>.spec.md` | Build specs, one per build, done in number order |
| `context/screenshots/<NN-name>.png` | Reference image for the spec of the same name. Always open it. |
| `context/00-foundation.md` | Shared reference: tokens, state model, data contract, build order and dependencies, and the "Acceptance that applies to every build" checklist |
| `context/PROJECT_OVERVIEW.md`, `context/AI_INTERACTION.md`, `context/CODING_STANDARDS.md` | Project rules. CLAUDE.md imports them. |
| `context/current-feature.md` | Tracker for the active build. It is the single source of truth for where things stand. |
| `context/feature-log.md` | Append-only history of ended builds |
| `.claude/skills/feature/templates/` | `spec.md` and `current-feature.md` templates |

`<NN-name>` is the slug, for example `01-app-shell`. The branch is `build/<NN-name>` (CODING_STANDARDS §13).

## Status lifecycle

`idle` → `loaded` → `planned` → `in-progress` → `review` → `testing` → `ready` → (`end`) → `idle`

- Read `context/current-feature.md` before every subcommand, and update it after every one. Update the `Status:` line and add a dated line to **Log** (`- YYYY-MM-DD — <what happened>`).
- Never silently skip a stage. If the user runs a subcommand out of order, say what's missing and ask whether to proceed. For example, `end` before `test` passes. `review` and `test` can run any number of times, in any order, once work has started.
- Keep the tracker concise. It is read at the start of every session through CLAUDE.md, so rewrite sections rather than pile up text.

## Package manager and scripts

Detect the package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `package-lock.json` → npm. Use it for every script. Run the scripts that exist in `package.json`: `typecheck` (fall back to `npx tsc --noEmit`), `lint`, `test`, `test:e2e`, `build`.

## Base branch

Use `main`. Record it in the tracker's `Base:` field when running `start`.

---

## `new <NN-name>`

Scaffold a spec.

1. If no number is given, use the next free `NN`. If `context/features/<NN-name>.spec.md` already exists, stop and say so.
2. Copy `templates/spec.md` to that path and fill in the title and number.
3. If the user described the build, draft its sections. Mark any guesses with `(?)`.
4. Tell the user to put the reference image at `context/screenshots/<NN-name>.png` and add a row for the build to the Builds table in `context/00-foundation.md`. Offer to add the row yourself.

The tracker is not changed.

## `load <NN-name>`

Make a spec the active build.

1. Resolve the spec. Accept `01`, `01-app-shell`, `app-shell` or a path, matched against `context/features/*.spec.md`. If nothing matches, or more than one file does, list the specs and stop.
2. If the tracker's status is not `idle`, say which build is active, then stop. The user must run `/feature end` first, or explicitly confirm that the current build should be replaced. If they confirm, log it as `abandoned` in `feature-log.md` first.
3. **Check dependencies.** Read the spec's `Depends on:` line and the Builds table in `00-foundation.md`. Every dependency must be logged as merged in `feature-log.md`. If any is missing, warn (AI_INTERACTION A2) and ask whether to continue.
4. Read the spec in full, and open the reference image `context/screenshots/<NN-name>.png`. If the image is missing, say so.
5. Write `context/current-feature.md` from `templates/current-feature.md`:
   - `Status: loaded`, plus the build name, spec path, image path, dependencies and loaded date
   - **Goal**: the spec's Goal, condensed to 2–3 sentences
   - **Done when**: the spec's "Done when" items, then the foundation's "Acceptance that applies to every build" items, all as unchecked boxes
   - **Open questions**: points where the spec and the image disagree, where two docs disagree, and where ambiguity would give two different UIs (the A3 "ask first" cases)
6. Report the goal, screens, Done-when list and open questions. Suggest `/feature start`.

## `start`

Plan, get a go-ahead, branch, and build. What happens depends on the tracker status.

**`loaded` → plan** (AI_INTERACTION A1.3)
1. Ask the open questions that block the design with AskUserQuestion, one at a time, each with your recommended answer. Record the answers under **Decisions**.
2. Study the codebase. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (AGENTS.md).
3. Write **Plan** in the tracker:
   - a 3–6 bullet restatement: what you'll build, what you won't touch, and the files you expect to create or change
   - an ordered checklist of small tasks, each one leaving the app running and each a sensible commit
   - any new dependency, with its one-line reason (CODING_STANDARDS §12)
4. Set `Status: planned`. Show the plan and ask for a go-ahead with AskUserQuestion: approve, change something, or stop. If the user asks for changes, revise the plan and ask again.

**`planned` → build** (after the go-ahead, in the same turn or on the next `/feature start`)
1. Check git. If the working tree has uncommitted changes outside `context/`, ask whether to commit or stash them first.
2. Create and switch to `build/<NN-name>` from `main` with `git switch -c`. Record `Branch:` and `Base:`. Set `Status: in-progress`.
3. Work through the plan task by task (AI_INTERACTION A6). After each meaningful step:
   - Run typecheck and lint, plus tests if they exist. Fix any failure before moving on.
   - Tick the task, and log any decision you made yourself (A3).
   - Commit that logical unit with a Conventional Commit message, such as `feat(shell): top bar with mode toggle`, ending with the Co-Authored-By trailer. Stage the specific files, not `-A`. Never commit `.env*` or secrets.
4. Stop and ask (A3) if you hit anything in the "ask first" list. If an earlier build is missing something this build needs, stop and report it (A2).
5. When every task is ticked, summarise what was built and suggest `/feature review`.

**`in-progress` → resume**: confirm you're on the build branch (switch to it if not), read the Plan and Log, then continue from the first unticked task.

## `status`

Read-only. Report the build, status, branch, plan progress (n/m tasks), Done-when progress, open questions, last log entry, and the recommended next command. If the status is `idle`, show the Builds table from `00-foundation.md` with each build marked done or not from `feature-log.md`, and name the next build whose dependencies are all met.

## `review`

Review the build against its spec and screens, then fix what's wrong.

1. Diff against the base: `git diff main...HEAD` plus uncommitted changes.
2. Open the reference image again and compare the UI section by section (S01, C01…). If you can, run the app and look at it at 1440, 1280 and 1024 wide.
3. Review every changed file against the sources of truth, in A4 order:
   - **Product rules**: never "safe", no overall score, never colour alone, one screen, per-user ownership
   - **The spec**: every task and Done-when item addressed, and nothing from a later build started
   - **Foundation**: data contract, state model, tokens (no hard-coded colours)
   - **The reference screens**: layout and copy
   - **CODING_STANDARDS**: `lib/data/` seam and scoping, server vs client, accessibility §8, copy §9, states §10, components §6
   - **General**: correctness bugs, edge cases, security
4. List the findings by severity (high, medium, low). Fix the high and medium ones. Fix low ones when cheap, or note them. If a finding needs a decision from A3's "ask first" list, ask instead of fixing. If the user said "review only", don't change code.
5. Commit the fixes (`fix(<area>): …`). Rewrite **Review** in the tracker: each finding with its severity and `fixed` or `open (reason)`. Set `Status: review`. Suggest `/feature test`.

## `test`

Verify the build works.

1. Run the scripts that exist: typecheck, lint, test, test:e2e, then build. Capture pass or fail for each, and the number of tests that passed.
2. If a check fails, fix the cause and rerun. Never weaken a lint or type rule, a product rule or a test to get a pass (A5). Commit the fixes.
3. CODING_STANDARDS §11 requires unit, component, e2e and guard tests. If the test tooling isn't set up yet, don't install it silently. It is a dependency decision, so ask (A3), with a recommendation of which build should own it.
4. Visual check: run the app and compare each screen against the reference image. Exercise it with the keyboard: focus is visible, and Esc and focus traps work.
5. Go through the **Done when** list and tick each item you verified by running it (A5: never mark something done you haven't run). For each unticked item, give the reason.
6. Rewrite **Tests** in the tracker as the "Checks run" line from the A7 report (typecheck ✓/✗ · lint ✓/✗ · tests ✓/✗ (n passed) · visual check ✓/✗), plus notes.
7. If everything passes, set `Status: ready` and suggest `/feature end`. Otherwise set `Status: testing` and list what's blocking.

## `end`

Report, then ship or abandon.

1. If the status isn't `ready`, warn about what hasn't passed and ask whether to continue anyway.
2. **Build report.** Write the AI_INTERACTION A7 report from the tracker and show it to the user.
3. Ask with AskUserQuestion how to finish. Only offer the options that apply:
   - **Merge + push** (recommended once the user has read the report): commit any remainder, `git switch main`, `git merge --no-ff build/<NN-name>`, `git push`, then delete the local branch
   - **Push + PR**: push the branch with `-u`. Open a PR with `gh pr create` if `gh` is installed, otherwise print the GitHub compare URL. Keep the branch.
   - **Commit only**: commit on the build branch and stay there
   - **Abandon**: discard the branch and its changes. This is destructive, so confirm a second time and name the branch.
4. Before the final commit (not for Abandon):
   - Append the report to `context/feature-log.md` under `## YYYY-MM-DD — Build NN · <name> (<outcome>)`.
   - Reset `context/current-feature.md` to the idle template.
5. Commit with `chore(<NN-name>): build report and close`, ending with the Co-Authored-By trailer. Never skip hooks, force-push or rewrite history (A5).
6. Carry out the chosen option.
   - **Abandon**: `git switch main`, then `git branch -D build/<NN-name>`. Then log the build as `abandoned` and reset the tracker on `main`.
7. Report the commit hash, the branch state, and the next build whose dependencies are now met. Suggest `/feature load <it>`.
