"use server";

import { z } from "zod";
import { lookupIdentity, lookupStructure } from "@/lib/data/inputs";
import { createRun, getExample, getRunSummary } from "@/lib/data/runs";
import { runIdSchema, type RunSummary } from "@/lib/types/domain";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
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
