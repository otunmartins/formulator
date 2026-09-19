"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { lookupIdentity, lookupStructure } from "@/lib/data/inputs";
import {
  createRun,
  getExample,
  getRunSummary,
  resolveRunIdentity,
  retryRunStep,
  type RunUpdateError,
} from "@/lib/data/runs";
import { runIdSchema, stepKeys, type RunSummary } from "@/lib/types/domain";
import type { RunEvents } from "@/lib/types/runEvents";
import { overrideFormat } from "@/lib/utils/identifiers";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
import { runRequestSchema, type Example } from "@/lib/types/runInput";
import { fail, ok, type ActionResult } from "@/lib/types/actions";

const openRunInput = z.object({ runId: runIdSchema });

/**
 * Loads one of the user's runs into the current screen (no navigation). Its progress then
 * comes from the events route. TODO(build-04): the dossier.
 */
export async function openRun(input: unknown): Promise<ActionResult<RunSummary>> {
  const parsed = openRunInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "That run ID isn't valid.");
  const run = await getRunSummary(parsed.data.runId);
  if (!run) return fail("not_found", "This run isn't in your current workspace.");
  return ok(run);
}

export interface LoadedExample {
  example: Example;
  /** The example protein's structure, so the chain chips can be shown straight away. */
  structure: StructureInfo | null;
  identity: IdentityHint;
}

/** The "Load example" template: fills the input panel and the run header. */
export async function loadExample(): Promise<ActionResult<LoadedExample>> {
  const example = await getExample();
  const { protein, excipient } = example.input;
  const [structure, identity] = await Promise.all([
    protein.source === "pdb" ? lookupStructure(protein.id) : Promise.resolve(null),
    lookupIdentity(excipient.query),
  ]);
  return ok({ example, structure, identity });
}

/**
 * Starts a screen from the input panel. The input is validated again here; the client's
 * validation is never trusted. The client then polls the events route for progress, and the
 * refresh puts the new run in Recent runs.
 */
export async function startRun(input: unknown): Promise<ActionResult<RunSummary>> {
  const parsed = runRequestSchema.safeParse(input);
  if (!parsed.success)
    return fail("invalid_input", "Some inputs aren't valid. Check the highlighted fields.");
  const run = await createRun(parsed.data);
  refresh();
  return ok(run);
}

const UPDATE_ERRORS: Record<
  RunUpdateError,
  { code: "not_found" | "invalid_input"; message: string }
> = {
  not_found: { code: "not_found", message: "This run isn't in your current workspace." },
  not_waiting: { code: "invalid_input", message: "This run isn't waiting for that anymore." },
  unknown_candidate: { code: "invalid_input", message: "Choose one of the listed candidates." },
};

function updateResult(result: RunEvents | RunUpdateError): ActionResult<RunEvents> {
  if (typeof result !== "string") return ok(result);
  const { code, message } = UPDATE_ERRORS[result];
  return fail(code, message);
}

const resolveIdentityInput = z.object({
  runId: runIdSchema,
  choice: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("candidate"), candidateId: z.string().min(1).max(64) }),
    z.object({ kind: z.literal("override"), value: z.string().trim().min(1).max(500) }),
  ]),
});

/**
 * Resolves a paused identity step (S05) with a listed candidate or a CAS/SMILES override.
 * The choice, the user and the time are recorded for the run manifest; the run resumes at
 * Precedent.
 */
export async function resolveIdentity(input: unknown): Promise<ActionResult<RunEvents>> {
  const parsed = resolveIdentityInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Choose a candidate or enter an override.");
  const { runId, choice } = parsed.data;
  if (choice.kind === "candidate") {
    return updateResult(await resolveRunIdentity(runId, choice));
  }
  const format = overrideFormat(choice.value);
  if (!format) {
    return fail("invalid_input", "Enter a CAS number (e.g. 9005-65-6) or a SMILES string.");
  }
  return updateResult(
    await resolveRunIdentity(runId, { kind: "override", value: choice.value, format }),
  );
}

const retryStepInput = z.object({ runId: runIdSchema, step: z.enum(stepKeys) });

/** Retries a failed step (S06). Completed steps are kept; the run resumes at that step. */
export async function retryStep(input: unknown): Promise<ActionResult<RunEvents>> {
  const parsed = retryStepInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "That step can't be retried.");
  return updateResult(await retryRunStep(parsed.data.runId, parsed.data.step));
}

// TODO(build-06): startSimulation, cancelSimulation
// TODO(build-07): signOff, newVersion, exportDossier · TODO(build-08): askDossier
