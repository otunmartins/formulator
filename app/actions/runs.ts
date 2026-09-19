"use server";

import { z } from "zod";
import { createRun, getExample, getRunSummary } from "@/lib/data/runs";
import { runIdSchema, type RunSummary } from "@/lib/types/domain";
import { runRequestSchema, type Example } from "@/lib/types/runInput";
import { fail, ok, type ActionResult } from "@/lib/types/actions";

const openRunInput = z.object({ runId: runIdSchema });

/**
 * Loads one of the user's runs into the current screen (no navigation).
 * TODO(build-03): also return steps; TODO(build-04): the dossier.
 */
export async function openRun(input: unknown): Promise<ActionResult<RunSummary>> {
  const parsed = openRunInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "That run ID isn't valid.");
  const run = await getRunSummary(parsed.data.runId);
  if (!run) return fail("not_found", "This run isn't in your current workspace.");
  return ok(run);
}

/** The "Load example" template. TODO(build-03): start a run from it. */
export async function loadExample(): Promise<ActionResult<Example>> {
  return ok(await getExample());
}

/**
 * Starts a screen from the input panel. The input is validated again here; the client's
 * validation is never trusted. TODO(build-03): progress polling for the returned run.
 */
export async function startRun(input: unknown): Promise<ActionResult<RunSummary>> {
  const parsed = runRequestSchema.safeParse(input);
  if (!parsed.success)
    return fail("invalid_input", "Some inputs aren't valid. Check the highlighted fields.");
  return ok(await createRun(parsed.data));
}

// TODO(build-03): resolveIdentity (override) · TODO(build-06): startSimulation, cancelSimulation
// TODO(build-07): signOff, newVersion, exportDossier · TODO(build-08): askDossier
