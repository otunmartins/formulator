// @vitest-environment node
import { createCookieJar } from "@/tests/helpers/cookieJar";
import { describe, expect, it, vi } from "vitest";

const jar = createCookieJar();
vi.mock("next/headers", () => ({ cookies: async () => jar.store }));
vi.mock("@/lib/auth/session", () => ({
  getSession: async () => ({
    user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
    workspaceIds: ["wsp_formulation"],
    workspaceId: "wsp_formulation",
  }),
}));

const { lookupIdentity, lookupStructure } = await import("./inputs");
const { createRun } = await import("./runs");

describe("lookupIdentity", () => {
  it("resolves Polysorbate 80 by name or CAS, ignoring case and spaces", async () => {
    const hint = { status: "resolved", name: "Polysorbate 80", cas: "9005-65-6" };
    expect(await lookupIdentity("  polysorbate 80 ")).toEqual(hint);
    expect(await lookupIdentity("9005-65-6")).toEqual(hint);
  });

  it("marks ALX-117 as a user SMILES with a visible placeholder", async () => {
    expect(await lookupIdentity("ALX-117")).toEqual({
      status: "user_smiles",
      name: "ALX-117",
      smiles: "[PLACEHOLDER]",
    });
  });

  it("returns no_match for anything else", async () => {
    expect(await lookupIdentity("CCO")).toEqual({ status: "no_match" });
  });
});

describe("lookupStructure", () => {
  it("lists 1N8Z's chains with the antigen excluded by default", async () => {
    const s = await lookupStructure("1n8z");
    expect(s?.label).toBe("1N8Z Fab");
    expect(s?.chains.map((c) => [c.id, c.excludedByDefault])).toEqual([
      ["A", false],
      ["B", false],
      ["C", true],
    ]);
  });

  it("returns null for an unknown ID", async () => {
    expect(await lookupStructure("9XYZ")).toBeNull();
  });
});

describe("createRun", () => {
  const context = {
    route: "SC",
    dose: { value: 150, unit: "mg" },
    frequency: "q2w",
    conc_mg_mL: 0.2,
    storage_C: 25,
  } as const;

  it("titles the run from the resolved identity and structure label", async () => {
    const run = await createRun({
      excipient: { query: "polysorbate 80", polymer: null },
      protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
      context,
    });
    expect(run.title).toBe("Polysorbate 80 × 1N8Z Fab");
    expect(run.runId).toMatch(/^RUN-\d{4}-\d{4}-\d{4}$/);
    expect(run).toMatchObject({ kind: "single", route: "SC", review: { status: "draft" } });
    expect(run).not.toHaveProperty("ownerId");
  });

  it("uses the query and source for unknown inputs", async () => {
    const run = await createRun({
      excipient: { query: "CCO", polymer: null },
      protein: { source: "uniprot", id: "P04626" },
      context,
    });
    expect(run.title).toBe("CCO × P04626");
  });

  it("gives each run a new ID", async () => {
    const input = {
      excipient: { query: "CCO", polymer: null },
      protein: { source: "sequence", fasta: "EVQL" },
      context,
    } as const;
    const a = await createRun(input);
    const b = await createRun(input);
    expect(a.runId).not.toBe(b.runId);
  });
});
