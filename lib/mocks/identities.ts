import type { IdentityHint } from "@/lib/types/lookups";

// Identity fixtures (Build 02 spec). Keys are lower-case names or CAS numbers.
// ALX-117 has no SMILES in any doc yet, so it stays a visible placeholder.

interface IdentityFixture {
  keys: readonly string[];
  hint: Exclude<IdentityHint, { status: "no_match" }>;
}

export const IDENTITIES: readonly IdentityFixture[] = [
  {
    keys: ["polysorbate 80", "9005-65-6"],
    hint: { status: "resolved", name: "Polysorbate 80", cas: "9005-65-6" },
  },
  {
    keys: ["alx-117"],
    hint: { status: "user_smiles", name: "ALX-117", smiles: "[PLACEHOLDER]" },
  },
];
