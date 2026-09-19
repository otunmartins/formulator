"use server";

import { z } from "zod";
import {
  lookupIdentity as lookupIdentityData,
  lookupStructure as lookupStructureData,
} from "@/lib/data/inputs";
import { fail, ok, type ActionResult } from "@/lib/types/actions";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";

const identityInput = z.object({ query: z.string().trim().min(1).max(2000) });
const structureInput = z.object({
  pdbId: z
    .string()
    .trim()
    .regex(/^[0-9][A-Za-z0-9]{3}$/),
});

/** The identity hint shown under the Excipient field, looked up on blur. */
export async function lookupIdentity(input: unknown): Promise<ActionResult<IdentityHint>> {
  const parsed = identityInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Enter a name, CAS or SMILES.");
  return ok(await lookupIdentityData(parsed.data.query));
}

/** Chains for a PDB ID, so the user can exclude e.g. the antigen chain. Null if unknown. */
export async function lookupStructure(input: unknown): Promise<ActionResult<StructureInfo | null>> {
  const parsed = structureInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Enter a 4-character PDB ID, e.g. 1N8Z.");
  return ok(await lookupStructureData(parsed.data.pdbId));
}
