import { z } from "zod";
import {
  runContextSchema,
  type DoseUnit,
  type Frequency,
  type Route,
  type StorageTemp,
} from "./domain";

// The input a user submits with "Run screen" (data contract `input`), validated with the same
// schema in the browser (inline errors) and in the `startRun` action (never trusted).
// The excipient's CAS and SMILES are resolved on the server, not taken from the client.

const polymerSchema = z.object({
  repeatUnit: z.string().trim().min(1, "Enter the repeat unit.").max(200),
  endGroups: z.string().trim().max(200),
  dp: z.string().trim().max(50),
  residualMonomers: z.array(z.string().trim().min(1).max(100)).max(20),
});
export type PolymerInput = z.infer<typeof polymerSchema>;

export const excipientInputSchema = z.object({
  query: z.string().trim().min(1, "Enter a name, CAS or SMILES.").max(2000, "Too long."),
  polymer: polymerSchema.nullable(),
});
export type ExcipientInput = z.infer<typeof excipientInputSchema>;

const PDB_ID = /^[0-9][A-Za-z0-9]{3}$/;
// UniProt accession format (uniprot.org/help/accession_numbers).
const UNIPROT_ID = /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$/;
const CHAIN_ID = z.string().regex(/^[A-Za-z0-9]{1,4}$/);
const RESIDUES = /^[ACDEFGHIKLMNPQRSTVWYBZXUO*]+$/;
export const MAX_FASTA_CHARS = 100_000;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Checks FASTA text: one or more records, each with at least one residue letter. */
export function fastaProblem(fasta: string): string | null {
  const text = fasta.trim();
  if (!text) return "Paste at least one sequence.";
  const records = text.startsWith(">") ? text.split(/\n(?=>)/) : [text];
  for (const record of records) {
    const lines = record.split(/\r?\n/);
    const body = (record.startsWith(">") ? lines.slice(1) : lines).join("").replace(/\s+/g, "");
    if (!body) return "Each record needs a sequence.";
    if (!RESIDUES.test(body.toUpperCase())) return "Use one-letter amino-acid codes only.";
  }
  return null;
}

export const proteinInputSchema = z.discriminatedUnion("source", [
  z
    .object({
      source: z.literal("pdb"),
      id: z.string().trim().regex(PDB_ID, "Enter a 4-character PDB ID, e.g. 1N8Z."),
      /** Included chains. Empty with nothing excluded means the chain list isn't known. */
      chains: z.array(CHAIN_ID).max(64),
      excludedChains: z.array(CHAIN_ID).max(64),
    })
    .refine((p) => p.chains.length > 0 || p.excludedChains.length === 0, {
      message: "Include at least one chain.",
      path: ["chains"],
    }),
  z.object({
    source: z.literal("uniprot"),
    id: z.string().trim().regex(UNIPROT_ID, "Enter a UniProt accession, e.g. P04626."),
  }),
  z.object({
    source: z.literal("sequence"),
    fasta: z
      .string()
      .max(MAX_FASTA_CHARS, "Sequence is too long.")
      .superRefine((fasta, ctx) => {
        const problem = fastaProblem(fasta);
        if (problem) ctx.addIssue({ code: "custom", message: problem });
      }),
  }),
  z.object({
    source: z.literal("upload"),
    fileName: z.string().min(1, "Choose a PDB or mmCIF file.").max(255),
    format: z.enum(["pdb", "mmcif"], { error: "Use a .pdb or .cif (mmCIF) file." }),
  }),
]);
export type ProteinInput = z.infer<typeof proteinInputSchema>;
export type ProteinSource = ProteinInput["source"];

export const runRequestSchema = z.object({
  excipient: excipientInputSchema,
  protein: proteinInputSchema,
  context: runContextSchema,
});
export type RunRequest = z.infer<typeof runRequestSchema>;

/** A starting point for a new screen ("Load example"). Not a run; has no owner. */
export const exampleSchema = z.object({
  title: z.string(),
  input: runRequestSchema,
});
export type Example = z.infer<typeof exampleSchema>;

// ---------------------------------------------------------------------------------------------
// Form draft: what the panel edits (strings for number fields, every tab's value kept while
// switching). Only the active protein tab is turned into the request.

export interface ChainOption {
  id: string;
  label: string;
}

export interface RunInputDraft {
  query: string;
  polymerOn: boolean;
  repeatUnit: string;
  endGroups: string;
  dp: string;
  /** Comma-separated in the form. */
  residualMonomers: string;
  proteinTab: ProteinSource;
  pdbId: string;
  /** Chains known for `pdbId` (from lookupStructure); empty when unknown. */
  pdbChains: ChainOption[];
  excludedChains: string[];
  uniprotId: string;
  fasta: string;
  upload: { fileName: string; format: "pdb" | "mmcif" | null; sizeBytes: number } | null;
  route: Route;
  doseValue: string;
  doseUnit: DoseUnit;
  frequency: Frequency;
  conc: string;
  storage: StorageTemp;
}

export const emptyDraft: RunInputDraft = {
  query: "",
  polymerOn: false,
  repeatUnit: "",
  endGroups: "",
  dp: "",
  residualMonomers: "",
  proteinTab: "pdb",
  pdbId: "",
  pdbChains: [],
  excludedChains: [],
  uniprotId: "",
  fasta: "",
  upload: null,
  // Spec defaults: route SC, storage 25 °C.
  route: "SC",
  doseValue: "",
  doseUnit: "mg",
  frequency: "q2w",
  conc: "",
  storage: 25,
};

/** Form field keys, used to place inline errors and to focus the first invalid field. */
export type FieldKey =
  | "query"
  | "repeatUnit"
  | "endGroups"
  | "dp"
  | "residualMonomers"
  | "pdbId"
  | "pdbChains"
  | "uniprotId"
  | "fasta"
  | "upload"
  | "dose"
  | "conc";

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** Order in which fields appear, so the first error can take focus. */
export const FIELD_ORDER: readonly FieldKey[] = [
  "query",
  "repeatUnit",
  "endGroups",
  "dp",
  "residualMonomers",
  "pdbId",
  "pdbChains",
  "uniprotId",
  "fasta",
  "upload",
  "dose",
  "conc",
];

/**
 * Splits the comma-separated monomer list. A comma followed by a digit is a locant inside a
 * name ("1,4-dioxane"), not a separator.
 */
export function splitMonomers(text: string): string[] {
  return text
    .split(/,(?!\d)/)
    .map((m) => m.trim())
    .filter(Boolean);
}

function toNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

function proteinFromDraft(d: RunInputDraft): unknown {
  switch (d.proteinTab) {
    case "pdb": {
      const known = d.pdbChains.map((c) => c.id);
      return {
        source: "pdb",
        id: d.pdbId.trim().toUpperCase(),
        chains: known.filter((id) => !d.excludedChains.includes(id)),
        excludedChains: d.excludedChains.filter((id) => known.includes(id)),
      };
    }
    case "uniprot":
      return { source: "uniprot", id: d.uniprotId.trim().toUpperCase() };
    case "sequence":
      return { source: "sequence", fasta: d.fasta };
    case "upload":
      return { source: "upload", fileName: d.upload?.fileName ?? "", format: d.upload?.format };
    default: {
      const unreachable: never = d.proteinTab;
      return unreachable;
    }
  }
}

function fieldFor(path: readonly PropertyKey[], tab: ProteinSource): FieldKey | null {
  const [group, key] = path;
  if (group === "excipient") {
    if (key === "query") return "query";
    const sub = path[2];
    if (key === "polymer" && typeof sub === "string") {
      return (
        (["repeatUnit", "endGroups", "dp", "residualMonomers"] as const).find((k) => k === sub) ??
        "repeatUnit"
      );
    }
  }
  if (group === "protein") {
    if (tab === "pdb") return key === "chains" ? "pdbChains" : "pdbId";
    if (tab === "uniprot") return "uniprotId";
    if (tab === "sequence") return "fasta";
    return "upload";
  }
  if (group === "context") return key === "dose" ? "dose" : key === "conc_mg_mL" ? "conc" : null;
  return null;
}

export type DraftResult = { ok: true; request: RunRequest } | { ok: false; errors: FieldErrors };

/** Validates the draft with the shared schema and returns the typed request or field errors. */
export function requestFromDraft(d: RunInputDraft): DraftResult {
  const candidate = {
    excipient: {
      query: d.query,
      polymer: d.polymerOn
        ? {
            repeatUnit: d.repeatUnit,
            endGroups: d.endGroups,
            dp: d.dp,
            residualMonomers: splitMonomers(d.residualMonomers),
          }
        : null,
    },
    protein: proteinFromDraft(d),
    context: {
      route: d.route,
      dose: { value: toNumber(d.doseValue), unit: d.doseUnit },
      frequency: d.frequency,
      conc_mg_mL: toNumber(d.conc),
      storage_C: d.storage,
    },
  };
  const parsed = runRequestSchema.safeParse(candidate);
  const tooLarge =
    d.proteinTab === "upload" && d.upload !== null && d.upload.sizeBytes > MAX_UPLOAD_BYTES;
  if (parsed.success && !tooLarge) return { ok: true, request: parsed.data };
  const errors: FieldErrors = tooLarge ? { upload: "File is larger than 20 MB." } : {};
  if (parsed.success) return { ok: false, errors };
  for (const issue of parsed.error.issues) {
    const key = fieldFor(issue.path, d.proteinTab);
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** Fills a draft from a request (e.g. "Load example"). Chain labels come from the structure. */
export function draftFromRequest(
  request: RunRequest,
  pdbChains: ChainOption[] = [],
): RunInputDraft {
  const { excipient, protein, context } = request;
  const draft: RunInputDraft = {
    ...emptyDraft,
    query: excipient.query,
    polymerOn: excipient.polymer !== null,
    repeatUnit: excipient.polymer?.repeatUnit ?? "",
    endGroups: excipient.polymer?.endGroups ?? "",
    dp: excipient.polymer?.dp ?? "",
    residualMonomers: excipient.polymer?.residualMonomers.join(", ") ?? "",
    proteinTab: protein.source,
    route: context.route,
    doseValue: String(context.dose.value),
    doseUnit: context.dose.unit,
    frequency: context.frequency,
    conc: String(context.conc_mg_mL),
    storage: context.storage_C,
  };
  switch (protein.source) {
    case "pdb":
      return { ...draft, pdbId: protein.id, pdbChains, excludedChains: protein.excludedChains };
    case "uniprot":
      return { ...draft, uniprotId: protein.id };
    case "sequence":
      return { ...draft, fasta: protein.fasta };
    case "upload":
      return {
        ...draft,
        upload: { fileName: protein.fileName, format: protein.format, sizeBytes: 0 },
      };
    default: {
      const unreachable: never = protein;
      return unreachable;
    }
  }
}

/** File format from a file name, or null if it isn't a PDB or mmCIF file. */
export function structureFormat(fileName: string): "pdb" | "mmcif" | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdb") || lower.endsWith(".ent")) return "pdb";
  if (lower.endsWith(".cif") || lower.endsWith(".mmcif")) return "mmcif";
  return null;
}
