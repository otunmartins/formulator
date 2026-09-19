import { describe, expect, it } from "vitest";
import { GRADE_ORDER, GRADES, SEVERITY, VERDICTS, verdictStyle } from "./verdicts";

describe("verdict mapping", () => {
  it("uses exactly the four foundation labels", () => {
    expect(Object.values(VERDICTS).map((v) => v.label)).toEqual([
      "Precedented",
      "Supported without precedent",
      "Data gap: test",
      "Alert: avoid",
    ]);
  });

  it("never labels a verdict as safe", () => {
    for (const v of Object.values(VERDICTS)) expect(v.label.toLowerCase()).not.toMatch(/\bsafe\b/);
  });

  it("gives every verdict an icon and token-based classes", () => {
    for (const key of ["prec", "supp", "gap", "alert"] as const) {
      const style = verdictStyle(key);
      expect(style.icon).toBeTruthy();
      expect(style.className).toContain(`text-${key}-text`);
    }
  });
});

describe("grades and severity", () => {
  it("defines a legend entry for A–E", () => {
    expect(GRADE_ORDER.map((g) => GRADES[g])).toHaveLength(5);
    expect(GRADES.E).toBe("No data");
  });

  it("keeps a text label on every severity", () => {
    expect(Object.values(SEVERITY).map((s) => s.label)).toEqual(["High", "Medium", "Low"]);
  });
});
