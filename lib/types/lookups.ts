/** The identity hint shown under the Excipient field (from `lookupIdentity`). */
export type IdentityHint =
  | { status: "resolved"; name: string; cas: string }
  /** Known to the user but not in any registry, e.g. an in-house code with its own SMILES. */
  | { status: "user_smiles"; name: string; smiles: string }
  | { status: "no_match" };

export interface StructureChain {
  id: string;
  label: string;
  /** Chains that are usually left out, e.g. the antigen in an antibody–antigen complex. */
  excludedByDefault: boolean;
}

/** A PDB entry as the Protein tab needs it (from `lookupStructure`). */
export interface StructureInfo {
  id: string;
  /** Short label used in run titles, e.g. "1N8Z Fab". */
  label: string;
  chains: StructureChain[];
}
