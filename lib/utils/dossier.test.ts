import { describe, expect, it } from "vitest";
import { ENDPOINT_SETS } from "@/lib/mocks/endpoints";
import { VERDICTS } from "./verdicts";
import { applyNovelRule, verdictCounts } from "./dossier";

const ps80 = ENDPOINT_SETS.ps80.endpoints;
const alx = ENDPOINT_SETS.alx117.endpoints;

describe("applyNovelRule", () => {
  it("leaves verdicts alone when the excipient has precedent at the route", () => {
    expect(applyNovelRule(ps80, false)).toEqual(ps80);
  });

  it("turns every Precedented and Supported verdict into a data gap when novel", () => {
    const ruled = applyNovelRule(ps80, true);
    expect(ruled.map((e) => e.verdict)).not.toContain("prec");
    expect(ruled.map((e) => e.verdict)).not.toContain("supp");
    // Alerts stay alerts; grades, basis and sources are kept.
    expect(ruled.find((e) => e.id === "perox")?.verdict).toBe("alert");
    expect(ruled.map((e) => e.grade)).toEqual(ps80.map((e) => e.grade));
    expect(ruled.map((e) => e.sources)).toEqual(ps80.map((e) => e.sources));
  });

  it("does not change the input", () => {
    applyNovelRule(ps80, true);
    expect(ps80[0]?.verdict).toBe("prec");
  });
});

describe("verdictCounts", () => {
  it("counts each verdict on its own (S07: 3 · 2 · 2 · 1)", () => {
    expect(verdictCounts(ps80)).toEqual({ prec: 3, supp: 2, gap: 2, alert: 1 });
  });

  it("gives zeros for verdicts with no rows (S15: 0 · 0 · 8 · 0)", () => {
    expect(verdictCounts(applyNovelRule(alx, true))).toEqual({
      prec: 0,
      supp: 0,
      gap: 8,
      alert: 0,
    });
  });
});

describe("fixtures", () => {
  it("S15: ALX-117 is novel for its route and every endpoint is a data gap graded C, D or E", () => {
    expect(ENDPOINT_SETS.alx117.novelForRoute).toBe(true);
    for (const e of alx) {
      expect(e.verdict).toBe("gap");
      expect(["C", "D", "E"]).toContain(e.grade);
    }
  });

  it("every grade D row carries an out-of-domain warning", () => {
    for (const e of [...ps80, ...alx]) {
      if (e.grade === "D") expect(e.ood).toBeTruthy();
    }
  });

  it("every endpoint has at least one source", () => {
    for (const e of [...ps80, ...alx]) expect(e.sources.length).toBeGreaterThan(0);
  });

  it("uses only the four verdict labels, none of them 'safe'", () => {
    const labels = Object.values(VERDICTS).map((v) => v.label);
    expect(labels).toEqual([
      "Precedented",
      "Supported without precedent",
      "Data gap: test",
      "Alert: avoid",
    ]);
    const text = JSON.stringify([...ps80, ...alx]);
    expect(text).not.toMatch(/\bsafe\b/i);
  });

  it("S06: three endpoints come from the precedent step", () => {
    expect(ps80.filter((e) => e.step === "precedent").map((e) => e.id)).toEqual([
      "reg",
      "tox",
      "residual",
    ]);
  });
});
