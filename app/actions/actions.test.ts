// @vitest-environment node
import { createCookieJar } from "@/tests/helpers/cookieJar";
import { afterEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh }));
const jar = createCookieJar();
vi.mock("next/headers", () => ({ cookies: async () => jar.store }));
vi.mock("@/lib/auth/session", () => {
  const session = {
    user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
    workspaceIds: ["wsp_formulation", "wsp_discovery"],
    workspaceId: "wsp_formulation",
  };
  return {
    getSession: async () => session,
    setActiveWorkspace: async (id: string) => session.workspaceIds.includes(id),
  };
});

const { openRun, loadExample, startRun, resolveIdentity, retryStep } = await import("./runs");
const { startDevRun } = await import("./dev");
const { lookupIdentity, lookupStructure } = await import("./inputs");
const { switchWorkspace } = await import("./workspace");

describe("openRun", () => {
  it("rejects malformed input", async () => {
    expect(await openRun({ runId: "<script>" })).toMatchObject({
      ok: false,
      error: { code: "invalid_input" },
    });
  });

  it("returns not_found for another user's run", async () => {
    expect(await openRun({ runId: "RUN-2026-0918-0999" })).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    });
  });

  it("opens the user's own run", async () => {
    const result = await openRun({ runId: "RUN-2026-0918-0412" });
    expect(result.ok && result.data.title).toBe("Polysorbate 80 × 1N8Z Fab");
  });
});

describe("loadExample", () => {
  it("returns the PS80 × 1N8Z template", async () => {
    const result = await loadExample();
    expect(result.ok && result.data.example.input.context.route).toBe("SC");
    expect(result.ok && result.data.structure?.label).toBe("1N8Z Fab");
    expect(result.ok && result.data.identity.status).toBe("resolved");
  });
});

describe("switchWorkspace", () => {
  it("refuses a workspace the user doesn't own", async () => {
    refresh.mockClear();
    expect(await switchWorkspace({ workspaceId: "wsp_other" })).toMatchObject({
      ok: false,
      error: { code: "forbidden" },
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("switches to an owned workspace and refreshes", async () => {
    refresh.mockClear();
    expect(await switchWorkspace({ workspaceId: "wsp_discovery" })).toEqual({
      ok: true,
      data: null,
    });
    expect(refresh).toHaveBeenCalledOnce();
  });
});

describe("startRun", () => {
  const valid = {
    excipient: { query: "Polysorbate 80", polymer: null },
    protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
    context: {
      route: "SC",
      dose: { value: 150, unit: "mg" },
      frequency: "q2w",
      conc_mg_mL: 0.2,
      storage_C: 25,
    },
  };

  it("revalidates on the server and rejects bad input", async () => {
    expect(
      await startRun({ ...valid, context: { ...valid.context, conc_mg_mL: -1 } }),
    ).toMatchObject({
      ok: false,
      error: { code: "invalid_input" },
    });
    expect(await startRun("not an object")).toMatchObject({ ok: false });
  });

  it("returns the new run's summary for valid input", async () => {
    const result = await startRun(valid);
    expect(result.ok && result.data.title).toBe("Polysorbate 80 × 1N8Z Fab");
  });
});

describe("lookups", () => {
  it("rejects malformed lookup input", async () => {
    expect(await lookupIdentity({ query: "" })).toMatchObject({ ok: false });
    expect(await lookupStructure({ pdbId: "<x>" })).toMatchObject({ ok: false });
  });

  it("returns the identity hint and structure", async () => {
    const identity = await lookupIdentity({ query: "9005-65-6" });
    expect(identity.ok && identity.data.status).toBe("resolved");
    const structure = await lookupStructure({ pdbId: "1N8Z" });
    expect(structure.ok && structure.data?.chains).toHaveLength(3);
  });
});

describe("run lifecycle actions", () => {
  const context = {
    route: "SC",
    dose: { value: 150, unit: "mg" },
    frequency: "q2w",
    conc_mg_mL: 0.2,
    storage_C: 25,
  };
  const protein = { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] };
  const start = async (query: string) => {
    const result = await startRun({ excipient: { query, polymer: null }, protein, context });
    if (!result.ok) throw new Error(result.error.message);
    return result.data.runId;
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("startRun refreshes so the run shows in Recent runs", async () => {
    refresh.mockClear();
    await start("Polysorbate 80");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("resolveIdentity checks the override and resumes the paused run", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-19T10:00:00Z"));
    const runId = await start("Tween 80 HP-K");
    vi.setSystemTime(new Date("2026-09-19T10:00:05Z"));

    expect(
      await resolveIdentity({ runId, choice: { kind: "override", value: "9005-65-7" } }),
    ).toMatchObject({ ok: false, error: { code: "invalid_input" } });
    expect(await resolveIdentity({ runId, choice: { kind: "nope" } })).toMatchObject({ ok: false });

    const resumed = await resolveIdentity({
      runId,
      choice: { kind: "override", value: "9005-65-6" },
    });
    expect(resumed.ok && resumed.data.steps.identity.note).toBe("Override · CAS 9005-65-6");
    expect(resumed.ok && resumed.data.steps.precedent.status).toBe("active");

    expect(
      await resolveIdentity({ runId, choice: { kind: "candidate", candidateId: "ps80" } }),
    ).toMatchObject({ ok: false, error: { message: "This run isn't waiting for that anymore." } });
  });

  it("retryStep only retries a failed step", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-19T10:00:00Z"));
    const runId = await start("Polysorbate 20");
    expect(await retryStep({ runId, step: "hazard" })).toMatchObject({ ok: false });
    vi.setSystemTime(new Date("2026-09-19T10:01:00Z"));
    expect(await retryStep({ runId, step: "bogus" })).toMatchObject({ ok: false });
    const retried = await retryStep({ runId, step: "hazard" });
    expect(retried.ok && retried.data.steps.precedent.status).toBe("done");
    expect(retried.ok && retried.data.steps.hazard.status).toBe("active");
  });

  it("startDevRun lands on S05 in development and is refused in production", async () => {
    const dev = await startDevRun({ state: "S05" });
    expect(dev.ok && dev.data.run.title).toBe("Tween 80 HP-K × 1N8Z Fab");
    vi.stubEnv("NODE_ENV", "production");
    expect(await startDevRun({ state: "S05" })).toMatchObject({
      ok: false,
      error: { code: "forbidden" },
    });
  });
});
