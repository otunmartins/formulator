// @vitest-environment node
import { describe, expect, it } from "vitest";
import { emptyDraft } from "@/lib/types/runInput";
import { formReducer } from "./RunInputProvider";

const withErrors = {
  draft: { ...emptyDraft, pdbId: "1N8Z" },
  errors: {
    query: "Enter a name, CAS or SMILES.",
    pdbId: "bad",
    repeatUnit: "Enter the repeat unit.",
  },
};

describe("formReducer", () => {
  it("clears the error of an edited field only", () => {
    const next = formReducer(withErrors, { type: "update", patch: { query: "CCO" } });
    expect(next.draft.query).toBe("CCO");
    expect(next.errors).toEqual({ pdbId: "bad", repeatUnit: "Enter the repeat unit." });
  });

  it("clears errors of fields hidden by switching tab or turning Polymer off", () => {
    const tab = formReducer(withErrors, { type: "update", patch: { proteinTab: "uniprot" } });
    expect(tab.errors).not.toHaveProperty("pdbId");
    const polymer = formReducer(withErrors, { type: "update", patch: { polymerOn: false } });
    expect(polymer.errors).not.toHaveProperty("repeatUnit");
  });

  it("drops a stale async patch when the field changed in the meantime", () => {
    const edited = formReducer(withErrors, { type: "update", patch: { pdbId: "2ABC" } });
    const stale = formReducer(edited, {
      type: "update",
      patch: (current) =>
        current.pdbId === "1N8Z" ? { pdbChains: [{ id: "A", label: "Light chain" }] } : {},
    });
    expect(stale).toBe(edited);
    expect(stale.draft.pdbId).toBe("2ABC");
  });
});
