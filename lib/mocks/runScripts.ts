import { z } from "zod";
import { endpointSetIdSchema } from "./endpoints";
import { runSummarySchema, stepKeys, type StepKey, type Steps } from "@/lib/types/domain";
import {
  runScriptSchema,
  type IdentityCandidate,
  type LiveRunState,
  type RunEvents,
  type StepFailure,
} from "@/lib/types/runEvents";

// Mock event scripts (Build 03). A run's progress is computed from its start time and the
// user's actions (identity override, retry), so no timers or server memory are needed:
// the same answer comes back from any serverless instance.
// TODO(phase-2): replaced by RunEvent rows written by the Python worker.

/** How long each step "runs" in the mock, in milliseconds. */
export const STEP_MS: Record<StepKey, number> = {
  identity: 1500,
  precedent: 2000,
  hazard: 2000,
  liability: 2000,
};

export const storedRunSchema = runSummarySchema.extend({
  ownerId: z.string(),
  workspaceId: z.string(),
  script: runScriptSchema,
  /** The excipient as entered. */
  query: z.string().max(2000),
  /** Done-notes per step; the identity note may be replaced by the user's override. */
  notes: z.object({
    identity: z.string(),
    precedent: z.string(),
    hazard: z.string(),
    liability: z.string(),
  }),
  startedAt: z.number().int().nonnegative(),
  /** The user's pick or override for an unresolved identity (recorded for the manifest). */
  resolution: z
    .object({
      at: z.number().int().nonnegative(),
      kind: z.enum(["candidate", "override"]),
      value: z.string().max(2000),
      note: z.string(),
      by: z.string(),
    })
    .optional(),
  /** Which endpoint fixture the dossier shows (Build 04); null when there is none. */
  endpointSet: endpointSetIdSchema.nullable().default(null),
  /** Retries of a failed step, oldest first. */
  retries: z.array(z.object({ step: z.enum(stepKeys), at: z.number().int().nonnegative() })),
});
export type StoredRun = z.infer<typeof storedRunSchema>;

/** Excipient names that trigger the non-happy scripts (case-insensitive). */
export const HAZARD_FAIL_TRIGGER = "polysorbate 20";

/** Candidates for known unresolved names (from the S05 reference screen). */
const CANDIDATES: Record<string, IdentityCandidate[]> = {
  "tween 80 hp-k": [
    { id: "ps80", name: "Polysorbate 80", cas: "9005-65-6", basis: "Name similarity 0.82" },
    {
      id: "ps80-hp",
      name: "Polysorbate 80, high-purity grade",
      cas: "9005-65-6",
      basis: "Grade-level record",
    },
  ],
};

export function candidatesFor(query: string): IdentityCandidate[] {
  return CANDIDATES[query.trim().toLowerCase()] ?? [];
}

export const HAZARD_FAILURE: StepFailure = {
  step: "hazard",
  reason: "PubChem hazard lookup timed out",
  detail: "HTTP 504, 3 attempts",
};

/** The failed step's one-line note in the progress strip (S06). */
const HAZARD_FAILED_NOTE = "Failed · HTTP 504";

/** Step done-notes for ALX-117 × 1N8Z (S15): a novel excipient entered as SMILES. */
export const ALX117_1N8Z_NOTES = {
  identity: "User SMILES · no registry match",
  precedent: "No precedent found",
  hazard: "8 endpoints",
  liability: "4 sites on 1N8Z",
} as const;

/** Step done-notes for the PS80 × 1N8Z screens; other runs just say "Complete". */
export const PS80_1N8Z_NOTES = {
  precedent: "6 sources",
  hazard: "8 endpoints",
  liability: "4 sites on 1N8Z",
} as const;

const RUNNING = "Running…";
const WAITING = "Waiting";

interface Segment {
  /** When the last step in the segment finished, or null if it hasn't yet. */
  finishedAt: number | null;
}

/** Runs `keys` in order from `startAt`, marking each pending, active or done at `now`. */
function runSegment(
  steps: Steps,
  keys: readonly StepKey[],
  startAt: number,
  now: number,
  notes: StoredRun["notes"],
): Segment {
  let t = startAt;
  for (const key of keys) {
    const end = t + STEP_MS[key];
    if (now < t) return { finishedAt: null };
    if (now < end) {
      steps[key] = { status: "active", note: RUNNING };
      return { finishedAt: null };
    }
    steps[key] = { status: "done", note: notes[key] };
    t = end;
  }
  return { finishedAt: t };
}

/**
 * The state of a stored run at time `now`. Completed steps are never recomputed after a
 * pause or failure: resuming starts a new segment at the next step.
 */
export function timelineAt(run: StoredRun, now: number): RunEvents {
  const steps = Object.fromEntries(
    stepKeys.map((k) => [k, { status: "pending", note: WAITING }]),
  ) as Steps;
  let runState: LiveRunState = "running";
  let failure: StepFailure | undefined;
  let candidates: IdentityCandidate[] | undefined;

  switch (run.script) {
    case "happy": {
      const seg = runSegment(steps, stepKeys, run.startedAt, now, run.notes);
      if (seg.finishedAt !== null) runState = "complete";
      break;
    }
    case "unresolved": {
      const identityEnd = run.startedAt + STEP_MS.identity;
      if (now < run.startedAt) break;
      if (now < identityEnd) {
        steps.identity = { status: "active", note: RUNNING };
        break;
      }
      if (!run.resolution) {
        steps.identity = { status: "needs_input", note: "Needs your input" };
        runState = "identity_unresolved";
        candidates = candidatesFor(run.query);
        break;
      }
      steps.identity = { status: "done", note: run.resolution.note };
      const rest = runSegment(
        steps,
        ["precedent", "hazard", "liability"],
        run.resolution.at,
        now,
        run.notes,
      );
      if (rest.finishedAt !== null) runState = "complete";
      break;
    }
    case "hazard_fail": {
      const first = runSegment(steps, ["identity", "precedent"], run.startedAt, now, run.notes);
      if (first.finishedAt === null) break;
      const hazardEnd = first.finishedAt + STEP_MS.hazard;
      if (now < hazardEnd) {
        steps.hazard = { status: "active", note: RUNNING };
        break;
      }
      const retry = run.retries.find((r) => r.step === "hazard" && r.at >= hazardEnd);
      if (!retry) {
        steps.hazard = { status: "error", note: HAZARD_FAILED_NOTE };
        runState = "error";
        failure = HAZARD_FAILURE;
        break;
      }
      // The retry resumes at the failed step; identity and precedent stay as they were.
      const rest = runSegment(steps, ["hazard", "liability"], retry.at, now, run.notes);
      if (rest.finishedAt !== null) runState = "complete";
      break;
    }
    default: {
      const unreachable: never = run.script;
      throw new Error(`Unknown script ${String(unreachable)}`);
    }
  }

  return {
    runId: run.runId,
    runState,
    steps,
    settled: runState !== "running",
    query: run.query,
    ...(candidates ? { candidates } : {}),
    ...(failure ? { failure } : {}),
  };
}
