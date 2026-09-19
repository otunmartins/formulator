"use server";

import { z } from "zod";
import { lookupIdentity, lookupStructure } from "@/lib/data/inputs";
import { createDevRun } from "@/lib/data/runs";
import { fail, ok, type ActionResult } from "@/lib/types/actions";
import type { RunSummary } from "@/lib/types/domain";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
import type { RunRequest } from "@/lib/types/runInput";

// Dev-only: the state switcher's shortcuts to S04–S06. Refused in production builds.

const devRunInput = z.object({ state: z.enum(["S04", "S05", "S06"]) });

export interface DevRun {
  run: RunSummary;
  input: RunRequest;
  structure: StructureInfo | null;
  identity: IdentityHint;
}

/** Starts a run that lands on S04, S05 or S06, with the inputs that produce it. */
export async function startDevRun(input: unknown): Promise<ActionResult<DevRun>> {
  if (process.env.NODE_ENV === "production") {
    return fail("forbidden", "The state switcher is only available in development.");
  }
  const parsed = devRunInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Unknown state.");
  const { run, request } = await createDevRun(parsed.data.state);
  const [structure, identity] = await Promise.all([
    request.protein.source === "pdb" ? lookupStructure(request.protein.id) : null,
    lookupIdentity(request.excipient.query),
  ]);
  return ok({ run, input: request, structure, identity });
}
