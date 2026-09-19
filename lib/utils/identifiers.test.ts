// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isCasNumber, looksLikeSmiles, overrideFormat } from "./identifiers";

describe("isCasNumber", () => {
  it("accepts CAS numbers with a correct check digit", () => {
    expect(isCasNumber("9005-65-6")).toBe(true); // polysorbate 80
    expect(isCasNumber("64-17-5")).toBe(true); // ethanol
    expect(isCasNumber("7732-18-5")).toBe(true); // water
  });

  it("rejects a wrong check digit or shape", () => {
    expect(isCasNumber("9005-65-7")).toBe(false);
    expect(isCasNumber("9005656")).toBe(false);
    expect(isCasNumber("1-17-5")).toBe(false);
  });
});

describe("looksLikeSmiles", () => {
  it("accepts plausible SMILES", () => {
    expect(looksLikeSmiles("CCO")).toBe(true);
    expect(looksLikeSmiles("CCCCCCCC=CCCCCCCCC(=O)O")).toBe(true);
    expect(looksLikeSmiles("[Na+].[Cl-]")).toBe(true);
  });

  it("rejects text that can't be SMILES", () => {
    expect(looksLikeSmiles("polysorbate 80")).toBe(false); // space
    expect(looksLikeSmiles("C(C")).toBe(false); // unbalanced
    expect(looksLikeSmiles("123")).toBe(false); // no atoms
    expect(looksLikeSmiles("<script>")).toBe(false);
  });
});

describe("overrideFormat", () => {
  it("classifies overrides", () => {
    expect(overrideFormat("9005-65-6")).toBe("cas");
    expect(overrideFormat("CCO")).toBe("smiles");
    expect(overrideFormat("9005-65-7")).toBeNull();
    expect(overrideFormat("Tween 80")).toBeNull();
  });
});
