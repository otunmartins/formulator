// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  draftFromRequest,
  emptyDraft,
  fastaProblem,
  requestFromDraft,
  structureFormat,
  type RunInputDraft,
} from "./runInput";

const valid: RunInputDraft = {
  ...emptyDraft,
  query: "Polysorbate 80",
  pdbId: "1n8z",
  pdbChains: [
    { id: "A", label: "Light chain" },
    { id: "B", label: "Heavy chain (Fab)" },
    { id: "C", label: "Antigen" },
  ],
  excludedChains: ["C"],
  doseValue: "150",
  conc: "0.2",
};

describe("requestFromDraft", () => {
  it("builds the typed request with defaults SC and 25 °C", () => {
    const result = requestFromDraft(valid);
    expect(result).toEqual({
      ok: true,
      request: {
        excipient: { query: "Polysorbate 80", polymer: null },
        protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
        context: {
          route: "SC",
          dose: { value: 150, unit: "mg" },
          frequency: "q2w",
          conc_mg_mL: 0.2,
          storage_C: 25,
        },
      },
    });
  });

  it("returns inline errors keyed by field for an empty panel", () => {
    const result = requestFromDraft(emptyDraft);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      query: "Enter a name, CAS or SMILES.",
      pdbId: "Enter a 4-character PDB ID, e.g. 1N8Z.",
      dose: "Enter a dose.",
      conc: "Enter a concentration.",
    });
  });

  it("rejects zero and negative numbers", () => {
    const result = requestFromDraft({ ...valid, doseValue: "0", conc: "-1" });
    expect(result.ok || result.errors).toEqual({
      dose: "Must be greater than 0.",
      conc: "Must be greater than 0.",
    });
  });

  it("requires a repeat unit only when Polymer is on", () => {
    expect(requestFromDraft({ ...valid, polymerOn: false }).ok).toBe(true);
    const on = requestFromDraft({ ...valid, polymerOn: true });
    expect(on.ok || on.errors.repeatUnit).toBe("Enter the repeat unit.");
    const filled = requestFromDraft({
      ...valid,
      polymerOn: true,
      repeatUnit: "-(CH2CH2O)-",
      residualMonomers: " Ethylene oxide, 1,4-dioxane ,",
    });
    expect(filled.ok && filled.request.excipient.polymer?.residualMonomers).toEqual([
      "Ethylene oxide",
      "1,4-dioxane",
    ]);
  });

  it("needs at least one included chain", () => {
    const result = requestFromDraft({ ...valid, excludedChains: ["A", "B", "C"] });
    expect(result.ok || result.errors).toEqual({ pdbChains: "Include at least one chain." });
  });

  it("sends only the active protein tab", () => {
    const result = requestFromDraft({
      ...valid,
      proteinTab: "uniprot",
      uniprotId: "p04626",
      fasta: "not used",
    });
    expect(result.ok && result.request.protein).toEqual({ source: "uniprot", id: "P04626" });
  });

  it("validates UniProt accessions, FASTA and uploads", () => {
    const bad = requestFromDraft({ ...valid, proteinTab: "uniprot", uniprotId: "HER2" });
    expect(bad.ok || bad.errors.uniprotId).toBe("Enter a UniProt accession, e.g. P04626.");

    const fasta = requestFromDraft({ ...valid, proteinTab: "sequence", fasta: ">HC\nEVQL 123" });
    expect(fasta.ok || fasta.errors.fasta).toBe("Use one-letter amino-acid codes only.");

    const noFile = requestFromDraft({ ...valid, proteinTab: "upload" });
    expect(noFile.ok || noFile.errors.upload).toBe("Choose a PDB or mmCIF file.");

    const wrongType = requestFromDraft({
      ...valid,
      proteinTab: "upload",
      upload: { fileName: "notes.txt", format: null, sizeBytes: 10 },
    });
    expect(wrongType.ok || wrongType.errors.upload).toBe("Use a .pdb or .cif (mmCIF) file.");

    const tooBig = requestFromDraft({
      ...valid,
      proteinTab: "upload",
      upload: { fileName: "big.cif", format: "mmcif", sizeBytes: 21 * 1024 * 1024 },
    });
    expect(tooBig.ok || tooBig.errors.upload).toBe("File is larger than 20 MB.");

    const ok = requestFromDraft({
      ...valid,
      proteinTab: "upload",
      upload: { fileName: "fab.cif", format: "mmcif", sizeBytes: 2048 },
    });
    expect(ok.ok && ok.request.protein).toEqual({
      source: "upload",
      fileName: "fab.cif",
      format: "mmcif",
    });
  });
});

describe("draftFromRequest", () => {
  it("round-trips through the form draft", () => {
    const first = requestFromDraft({ ...valid, polymerOn: true, repeatUnit: "-(CH2CH2O)-" });
    if (!first.ok) throw new Error("expected valid");
    const again = requestFromDraft(draftFromRequest(first.request, valid.pdbChains));
    expect(again).toEqual(first);
  });
});

describe("helpers", () => {
  it("checks FASTA records", () => {
    expect(fastaProblem(">HC_VH\nEVQLVESGGG\n>LC_VL\nDIQMTQSPSS")).toBeNull();
    expect(fastaProblem("EVQLVESGGG")).toBeNull();
    expect(fastaProblem(">only a header")).toBe("Each record needs a sequence.");
    expect(fastaProblem("   ")).toBe("Paste at least one sequence.");
  });

  it("detects structure file formats", () => {
    expect(structureFormat("1N8Z.pdb")).toBe("pdb");
    expect(structureFormat("model.CIF")).toBe("mmcif");
    expect(structureFormat("notes.txt")).toBeNull();
  });
});
