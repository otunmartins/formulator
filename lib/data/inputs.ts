import "server-only";
import { getSession } from "@/lib/auth/session";
import { IDENTITIES } from "@/lib/mocks/identities";
import { STRUCTURES } from "@/lib/mocks/structures";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
import { dataSource } from "./source";

/**
 * The identity hint for an excipient query (name, CAS or SMILES).
 * TODO(phase-2): PubChem / ChEBI / excipient registry via the worker.
 */
export async function lookupIdentity(query: string): Promise<IdentityHint> {
  await getSession();
  dataSource();
  const key = query.trim().toLowerCase();
  return IDENTITIES.find((i) => i.keys.includes(key))?.hint ?? { status: "no_match" };
}

/** Chains and label for a PDB ID, or null if the mock data doesn't know it. */
export async function lookupStructure(pdbId: string): Promise<StructureInfo | null> {
  await getSession();
  dataSource();
  const id = pdbId.trim().toUpperCase();
  return STRUCTURES.find((s) => s.id === id) ?? null;
}
