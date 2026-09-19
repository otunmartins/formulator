---
name: feature
description: Spec-driven feature workflow. Subcommands new, load, start, status, review, test, end. Tracks the active feature in context/current-feature.md. Use only when the user runs /feature.
argument-hint: "[new <name> | load <name> | start | status | review | test | end]"
disable-model-invocation: true
---

# /feature workflow

Arguments: `$ARGUMENTS`

The first word is the subcommand. Everything after it is its argument. With no arguments, run `status`.

## Files

| Path | Purpose |
|---|---|
| `context/features/<slug>.md` | Feature specs, one file per feature. The user writes them, or `new` scaffolds one. |
| `context/screenshots/` | Reference images that specs link to. Read any image a spec links to. |
| `context/current-feature.md` | Tracker for the active feature. It is the single source of truth for where things stand. |
| `context/feature-log.md` | Append-only history of features that ended. |
| `.claude/skills/feature/templates/` | `spec.md` and `current-feature.md` templates. |

`<slug>` is kebab-case, for example `user-login`.

## Status lifecycle

`idle` → `loaded` → `in-progress` → `review` → `testing` → `ready` → (`end`) → `idle`

- Read `context/current-feature.md` before every subcommand, and update it after every one. Update the `Status:` line and add a dated line to **Log** (`- YYYY-MM-DD — <what happened>`).
- Never silently skip a stage. If the user runs a subcommand out of order, say what's missing and ask whether to proceed. For example, `end` before `test` passes. `review` and `test` can run any number of times, in any order, once work has started.
- Keep the tracker concise. It is read at the start of every session through CLAUDE.md, so rewrite sections rather than pile up text.

## Base branch

Detect the base branch once, when running `start`: use `main` if it exists, otherwise `master`. Record it in the tracker's `Base:` field. Everything after that reads it from the tracker.

---

## `new <name>`

Scaffold a spec.

1. Slugify the name. If `context/features/<slug>.md` already exists, stop and say so.
2. Copy `templates/spec.md` to that path and fill in the title.
3. If the user gave a description (after the name, or earlier in the conversation), draft the Summary, Requirements and Acceptance criteria from it. Mark any guesses with `(?)`.
4. Tell the user the path, and that the next step is to edit the spec and run `/feature load <slug>`.

The tracker is not changed.

## `load <name-or-path>`

Make a spec the active feature.

1. Resolve the spec. Try an exact path, then `context/features/<arg>.md`, then a fuzzy filename match in `context/features/`. If nothing matches, or more than one file does, list the available specs and stop.
2. If the tracker's status is not `idle`, say which feature is active, then stop. The user must run `/feature end` first, or explicitly confirm that the current feature should be replaced. If they confirm, log it as `abandoned` in `feature-log.md` first.
3. Read the spec in full, including any screenshots it links to.
4. Write `context/current-feature.md` from `templates/current-feature.md`:
   - `Status: loaded`, plus the feature name, spec path and loaded date
   - **Goal**: 2–4 sentences summarising the spec
   - **Acceptance criteria**: copy them as unchecked boxes. If the spec has none, write them from the requirements and flag that you did.
   - **Open questions**: anything ambiguous, contradictory or missing in the spec
5. Report the goal, criteria and open questions. Suggest answering the questions, then running `/feature start`.

## `start`

Plan the feature, branch, and build it. If the status is already `in-progress`, this resumes work instead.

**Fresh start** (status `loaded`):
1. If there are open questions that block the design, ask them now with AskUserQuestion. Record the answers under **Decisions**.
2. Check git. If the working tree has uncommitted changes other than `context/`, ask whether to commit or stash them first.
3. Detect the base branch. Create and switch to `feature/<slug>` from it with `git switch -c`. Record `Branch:` and `Base:`.
4. Study the codebase areas the spec touches. This project runs a Next.js version with breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, as AGENTS.md requires.
5. Write **Plan** in the tracker: an ordered checklist of small, verifiable tasks, each naming the files it touches.
6. Set `Status: in-progress`, then implement the plan task by task. Tick each box as it's done, and log notable decisions. Keep the tracker current as you go, not only at the end, so an interrupted session can resume.
7. When every task is ticked, run a quick `npm run lint`. Summarise what was built, then suggest `/feature review`.

**Resume** (status `in-progress`): confirm you're on the feature branch (switch to it if not), read the Plan and Log, and continue from the first unticked task.

## `status`

Read-only. Report the feature, status, branch, plan progress (n/m tasks), acceptance criteria met, open questions, last log entry, and the recommended next command. If the status is `idle`, list the specs in `context/features/` that aren't recorded as done in `feature-log.md`.

## `review`

Review the feature's code and fix the problems found.

1. Diff the branch against the base: `git diff <base>...HEAD` plus uncommitted changes (`git diff HEAD`, and untracked files from `git status`).
2. Review every changed file against:
   - **The spec**: every requirement and acceptance criterion addressed, and nothing out of scope added
   - **Correctness**: logic bugs, edge cases, error and loading states, async and race issues
   - **Next.js**: server vs client component boundaries, data fetching, and the conventions in `node_modules/next/dist/docs/`
   - **Security**: input validation, secrets, XSS, auth checks on server actions and routes
   - **Quality**: dead code, duplication, naming, consistency with surrounding code, accessibility for UI
3. Fix each real issue directly. Don't just list it. If a fix would change behaviour the spec leaves undecided, ask first.
4. Rewrite **Review** in the tracker: the date, then each finding marked `fixed` or `open (reason)`. Set `Status: review`.
5. Report the findings and fixes. Suggest `/feature test`.

## `test`

Verify the feature works.

1. Check `package.json` for the scripts that exist. Run each applicable check and capture the results:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm test`, if a `test` script exists
   - `npm run build`
2. If a check fails, fix the cause and rerun until it passes, or until it's clear the failure needs the user. Never weaken a lint or type rule, or delete a test, to get a pass.
3. Go through each **Acceptance criterion** and verify it against the code. For UI or behaviour, run the app (use the `run` skill if available, or `npm run dev`) and exercise it. Tick the criteria that are met.
4. The repo has no test framework yet. Don't install one unasked. If the feature has logic worth unit-testing, suggest it once.
5. Rewrite **Tests** in the tracker with the date, each check's pass or fail result, and each criterion's result.
6. If everything passes, set `Status: ready` and suggest `/feature end`. Otherwise set `Status: testing` and list what's blocking.

## `end`

Finish the feature: ship it or abandon it.

1. If the status isn't `ready`, warn about what hasn't passed and ask whether to continue anyway.
2. Show `git status` and a short diff summary against the base.
3. Ask with AskUserQuestion how to finish. Only offer the options that apply:
   - **Merge locally** (recommended when there's no remote): commit, merge into the base with `--no-ff`, delete the feature branch
   - **Push + PR**: only if `git remote` is non-empty. Commit, push with `-u`, then open a PR with `gh pr create` if `gh` is installed. Otherwise print the compare URL. Keep the branch.
   - **Commit only**: commit on the feature branch and stay there
   - **Abandon**: discard the branch and its changes. This is destructive, so confirm a second time and name the branch that will be deleted.
4. Before the final commit (not for Abandon):
   - Append an entry to `context/feature-log.md`: the date, feature, spec, branch, outcome, a one-line summary, and any open follow-ups.
   - Reset `context/current-feature.md` to the idle state: the template with `Status: idle` and the fields empty.
5. Commit. Stage the specific changed files, not `-A` blindly. Check that no secrets or `.env` files are staged. Use a conventional commit message such as `feat(<slug>): <summary>`, with a body listing the key changes, ending with the Co-Authored-By trailer from the harness instructions. Never skip hooks.
6. Carry out the chosen option.
   - **Abandon**: `git switch <base>`, then `git branch -D feature/<slug>`. Then log the feature as `abandoned` in the feature log and reset the tracker on the base branch.
7. Report what was done, including the commit hash and branch state. Suggest `/feature load <next-spec>` when specs are waiting.
