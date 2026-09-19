import { z } from "zod";
import type { StepKey, Steps } from "./domain";

/** Which mock event script a run follows (Build 03). TODO(phase-2): real worker events. */
export const runScriptSchema = z.enum(["happy", "unresolved", "hazard_fail"]);
export type RunScript = z.infer<typeof runScriptSchema>;

/** Where a run is, as the screen needs it. `identity_unresolved` is a pause, not a failure. */
export type LiveRunState = "running" | "identity_unresolved" | "error" | "complete";

/** A registry record the user can pick when the identity step can't resolve on its own. */
export interface IdentityCandidate {
  id: string;
  name: string;
  cas: string;
  /** Why it's listed, e.g. "Name similarity 0.82" or "Grade-level record". */
  basis: string;
}

export interface StepFailure {
  step: StepKey;
  /** e.g. "PubChem hazard lookup timed out" */
  reason: string;
  /** e.g. "HTTP 504, 3 attempts" */
  detail: string;
}

/** What the polling route handler returns for a run. */
export interface RunEvents {
  runId: string;
  runState: LiveRunState;
  steps: Steps;
  /** True once nothing more will change without the user (complete, paused or failed). */
  settled: boolean;
  /** The excipient as entered, shown in the identity card. */
  query: string;
  /** Only while the identity step needs input. */
  candidates?: IdentityCandidate[];
  /** Only while a step has failed. */
  failure?: StepFailure;
}
