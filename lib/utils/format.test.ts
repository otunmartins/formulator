import { describe, expect, it } from "vitest";
import { formatContextLine, formatRunTime, reviewLabel, shortRunId } from "./format";

describe("shortRunId", () => {
  it("drops the year", () => {
    expect(shortRunId("RUN-2026-0918-0412")).toBe("RUN-0918-0412");
  });
  it("leaves unexpected IDs alone", () => {
    expect(shortRunId("something")).toBe("something");
  });
});

describe("formatContextLine", () => {
  it("formats units with a space and proper symbols", () => {
    expect(
      formatContextLine({
        route: "SC",
        dose: { value: 150, unit: "mg" },
        frequency: "q2w",
        conc_mg_mL: 0.2,
        storage_C: 25,
      }),
    ).toBe("SC · 150 mg every 2 weeks · 0.2 mg/mL excipient · stored at 25 °C");
  });
});

describe("formatRunTime", () => {
  const now = new Date("2026-09-18T16:00:00Z");
  it("shows today's runs with a time", () => {
    expect(formatRunTime("2026-09-18T14:12:00Z", now, "UTC")).toBe("Today 14:12");
  });
  it("shows yesterday", () => {
    expect(formatRunTime("2026-09-17T09:00:00Z", now, "UTC")).toBe("Yesterday");
  });
  it("shows older runs as day and month", () => {
    expect(formatRunTime("2026-09-12T09:00:00Z", now, "UTC")).toBe("12 Sep");
  });
});

describe("reviewLabel", () => {
  it("labels draft and signed versions", () => {
    expect(reviewLabel({ status: "draft", version: 1 })).toBe("Draft");
    expect(reviewLabel({ status: "signed", version: 2 })).toBe("Signed off v2");
  });
});
