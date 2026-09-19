// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth/session";
import type { RunContext } from "@/lib/types/domain";
import type { RunRequest } from "@/lib/types/runInput";
import { createCookieJar } from "@/tests/helpers/cookieJar";

const jar = createCookieJar();
vi.mock("next/headers", () => ({ cookies: async () => jar.store }));

const motun: Session = {
  user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
  workspaceIds: ["wsp_formulation", "wsp_discovery"],
  workspaceId: "wsp_formulation",
};
const session: { current: Session } = { current: motun };
vi.mock("@/lib/auth/session", () => ({ getSession: async () => session.current }));

const { createDevRun, createRun, resolveRunIdentity, retryRunStep } = await import("./runs");
const { getDossier } = await import("./dossier");
const { STEP_MS } = await import("@/lib/mocks/runScripts");

const context: RunContext = {
  route: "SC",
  dose: { value: 150, unit: "mg" },
  frequency: "q2w",
  conc_mg_mL: 0.2,
  storage_C: 25,
};
const request = (query: string): RunRequest => ({
  excipient: { query, polymer: null },
  protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
  context,
});

const T0 = new Date("2026-09-19T10:00:00Z");
const { identity: I, precedent: P, hazard: H, liability: L } = STEP_MS;
const DONE = T0.getTime() + I + P + H + L;

beforeEach(() => {
  jar.values.clear();
  session.current = motun;
});

describe("getDossier", () => {
  it("S07: a complete PS80 run returns all 8 endpoints with their verdicts", async () => {
    const run = await createRun(request("Polysorbate 80"), T0);
    const dossier = await getDossier(run.runId, DONE);
    if (typeof dossier === "string") throw new Error(dossier);
    expect(dossier.endpoints).toHaveLength(8);
    expect(dossier.novelForRoute).toBe(false);
    expect(dossier.partial).toBe(false);
    expect(dossier.hasFixture).toBe(true);
    expect(dossier.endpoints.find((e) => e.id === "perox")?.verdict).toBe("alert");
  });

  it("S15: ALX-117 is novel for the route, with no positive verdicts and its S15 step notes", async () => {
    const run = await createRun(request("ALX-117"), T0);
    const dossier = await getDossier(run.runId, DONE);
    if (typeof dossier === "string") throw new Error(dossier);
    expect(dossier.novelForRoute).toBe(true);
    expect(dossier.excipient).toBe("ALX-117");
    expect(dossier.route).toBe("SC");
    expect(dossier.endpoints.every((e) => e.verdict === "gap")).toBe(true);
    const stored = JSON.parse(
      Buffer.from(jar.values.get("es_runs") ?? "", "base64url").toString("utf8"),
    ) as Array<{ notes: Record<string, string> }>;
    expect(stored[0]?.notes).toEqual({
      identity: "User SMILES · no registry match",
      precedent: "No precedent found",
      hazard: "8 endpoints",
      liability: "4 sites on 1N8Z",
    });
  });

  it("has no results while the run is running or paused", async () => {
    const running = await createRun(request("Polysorbate 80"), T0);
    expect(await getDossier(running.runId, T0.getTime() + I + 10)).toBe("no_results");
    const paused = await createRun(request("Tween 80 HP-K"), new Date(T0.getTime() + 1000));
    expect(await getDossier(paused.runId, DONE + 5000)).toBe("no_results");
  });

  it("S06: after the hazard step fails, only the completed precedent endpoints are returned", async () => {
    const run = await createRun(request("Polysorbate 20"), T0);
    const failedAt = T0.getTime() + I + P + H + 10;
    const partial = await getDossier(run.runId, failedAt);
    if (typeof partial === "string") throw new Error(partial);
    // Polysorbate 20 has no endpoint fixture, so it shows the placeholder row.
    expect(partial).toMatchObject({ partial: true, hasFixture: false, endpoints: [] });

    await retryRunStep(run.runId, "hazard", failedAt);
    const complete = await getDossier(run.runId, failedAt + H + L + 10);
    if (typeof complete === "string") throw new Error(complete);
    expect(complete.partial).toBe(false);
  });

  it("S06 (dev): PS80 failing at hazard keeps only its 3 precedent endpoints", async () => {
    const { run } = await createDevRun("S06");
    const partial = await getDossier(run.runId);
    if (typeof partial === "string") throw new Error(partial);
    expect(run.title).toBe("Polysorbate 80 × 1N8Z Fab");
    expect(partial.partial).toBe(true);
    expect(partial.endpoints.map((e) => e.id)).toEqual(["reg", "tox", "residual"]);
    expect(partial.endpoints.every((e) => e.verdict === "prec")).toBe(true);
  });

  it("S15 (dev): ALX-117 at 1.0 mg/mL with the polymer fields from its input panel", async () => {
    const { run, request } = await createDevRun("S15");
    expect(run.context?.conc_mg_mL).toBe(1);
    expect(request.excipient.polymer).toEqual({
      repeatUnit: "-(OCH2CH2)- / -(OCH(CH3)CO)-[PLACEHOLDER]",
      endGroups: "Methoxy / –OH",
      dp: "PEG ≈ 45, PLGA [PLACEHOLDER]",
      residualMonomers: ["Lactide", "glycolide"],
    });
  });

  it("an identity resolved to PS80 (candidate or CAS override) gets the PS80 endpoints", async () => {
    const byCandidate = await createRun(request("Tween 80 HP-K"), T0);
    const pausedAt = T0.getTime() + I + 10;
    await resolveRunIdentity(
      byCandidate.runId,
      { kind: "candidate", candidateId: "ps80-hp" },
      pausedAt,
    );
    const a = await getDossier(byCandidate.runId, pausedAt + P + H + L + 10);
    if (typeof a === "string") throw new Error(a);
    expect(a.endpoints).toHaveLength(8);

    const bySmiles = await createRun(request("Unknownium"), new Date(T0.getTime() + 2000));
    const smilesAt = T0.getTime() + 2000 + I + 10;
    await resolveRunIdentity(
      bySmiles.runId,
      { kind: "override", value: "CCO", format: "smiles" },
      smilesAt,
    );
    const b = await getDossier(bySmiles.runId, smilesAt + P + H + L + 10);
    if (typeof b === "string") throw new Error(b);
    expect(b).toMatchObject({ hasFixture: false, endpoints: [] });
  });

  it("opens the PS80 fixture run from Recent runs as complete", async () => {
    const dossier = await getDossier("RUN-2026-0918-0412");
    if (typeof dossier === "string") throw new Error(dossier);
    expect(dossier.endpoints).toHaveLength(8);
  });

  it("never returns another user's run, or a run from another workspace", async () => {
    expect(await getDossier("RUN-2026-0918-0999")).toBe("not_found");
    const run = await createRun(request("Polysorbate 80"), T0);
    session.current = { ...motun, workspaceId: "wsp_discovery" };
    expect(await getDossier(run.runId, DONE)).toBe("not_found");
    session.current = {
      user: { id: "usr_other", name: "Other", initials: "OT" },
      workspaceIds: ["wsp_formulation"],
      workspaceId: "wsp_formulation",
    };
    expect(await getDossier(run.runId, DONE)).toBe("not_found");
  });
});
