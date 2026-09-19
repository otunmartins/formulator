// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth/session";
import type { RunContext } from "@/lib/types/domain";
import type { ProteinInput, RunRequest } from "@/lib/types/runInput";
import { createCookieJar } from "@/tests/helpers/cookieJar";

const jar = createCookieJar();
vi.mock("next/headers", () => ({ cookies: async () => jar.store }));

const session: { current: Session } = {
  current: {
    user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
    workspaceIds: ["wsp_formulation", "wsp_discovery"],
    workspaceId: "wsp_formulation",
  },
};
vi.mock("@/lib/auth/session", () => ({ getSession: async () => session.current }));

const { createRun, getRunEvents, getRunSummary, listRecentRuns, resolveRunIdentity, retryRunStep } =
  await import("./runs");
const { STEP_MS } = await import("@/lib/mocks/runScripts");

const context: RunContext = {
  route: "SC",
  dose: { value: 150, unit: "mg" },
  frequency: "q2w",
  conc_mg_mL: 0.2,
  storage_C: 25,
};
const pdb: ProteinInput = { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] };
const request = (query: string): RunRequest => ({
  excipient: { query, polymer: null },
  protein: pdb,
  context,
});

const T0 = new Date("2026-09-19T10:00:00Z");
const t = (ms: number) => T0.getTime() + ms;
const { identity: I, precedent: P, hazard: H, liability: L } = STEP_MS;

function asMotun(workspaceId = "wsp_formulation") {
  session.current = {
    user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
    workspaceIds: ["wsp_formulation", "wsp_discovery"],
    workspaceId,
  };
}

function storedRuns(): Array<Record<string, unknown>> {
  const raw = jar.values.get("es_runs") ?? "";
  return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
}

const statusesOf = (e: { steps: Record<string, { status: string }> }) =>
  Object.values(e.steps).map((s) => s.status);

beforeEach(() => {
  jar.values.clear();
  asMotun();
});

describe("createRun + getRunEvents", () => {
  it("stores the run in the cookie and replays the happy path", async () => {
    const run = await createRun(request("Polysorbate 80"), T0);
    expect(run.title).toBe("Polysorbate 80 × 1N8Z Fab");
    expect(storedRuns()).toHaveLength(1);

    const mid = await getRunEvents(run.runId, t(I + 100));
    expect(mid?.steps.identity).toEqual({ status: "done", note: "Polysorbate 80 · CAS 9005-65-6" });
    expect(mid?.steps.precedent.status).toBe("active");

    const end = await getRunEvents(run.runId, t(I + P + H + L));
    expect(end?.runState).toBe("complete");
    expect(end?.steps.liability.note).toBe("4 sites on 1N8Z");
  });

  it("lists started runs in Recent runs and reopens them without mock internals", async () => {
    const run = await createRun(request("Polysorbate 80"), T0);
    expect((await listRecentRuns())[0]?.runId).toBe(run.runId);
    const summary = await getRunSummary(run.runId);
    expect(summary?.title).toBe(run.title);
    expect(summary).not.toHaveProperty("script");
    expect(summary).not.toHaveProperty("ownerId");
  });

  it("picks the script from the input", async () => {
    const unresolved = await createRun(request("Tween 80 HP-K"), T0);
    expect(unresolved.title).toBe("Tween 80 HP-K × 1N8Z Fab");
    expect((await getRunEvents(unresolved.runId, t(I)))?.runState).toBe("identity_unresolved");

    const failing = await createRun(request("Polysorbate 20"), T0);
    const failed = await getRunEvents(failing.runId, t(I + P + H));
    expect(failed?.runState).toBe("error");
    expect(failed?.steps.identity.note).toBe("Polysorbate 20 · CAS [PLACEHOLDER]");

    const alx = await createRun(request("ALX-117"), T0);
    // On 1N8Z the S15 notes apply (Build 04).
    expect((await getRunEvents(alx.runId, t(I)))?.steps.identity.note).toBe(
      "User SMILES · no registry match",
    );
  });

  it("gives runs started in the same second different IDs", async () => {
    const a = await createRun(request("Polysorbate 80"), T0);
    const b = await createRun(request("Polysorbate 80"), T0);
    expect(a.runId).not.toBe(b.runId);
  });

  it("shows fixture runs as complete", async () => {
    const events = await getRunEvents("RUN-2026-0918-0412");
    expect(events?.runState).toBe("complete");
    expect(events?.steps.precedent.note).toBe("6 sources");
  });
});

describe("scoping", () => {
  it("hides a stored run from another workspace and from another user", async () => {
    const run = await createRun(request("Polysorbate 80"), T0);
    asMotun("wsp_discovery");
    expect(await getRunEvents(run.runId)).toBeNull();
    expect((await listRecentRuns()).some((r) => r.runId === run.runId)).toBe(false);

    session.current = {
      user: { id: "usr_other", name: "Other", initials: "OT" },
      workspaceIds: ["wsp_formulation"],
      workspaceId: "wsp_formulation",
    };
    expect(await getRunEvents(run.runId)).toBeNull();
    expect(await getRunSummary(run.runId)).toBeNull();
  });

  it("ignores a malformed or tampered cookie", async () => {
    jar.values.set("es_runs", "not-base64-json");
    expect(await listRecentRuns()).toHaveLength(4);
    const forged = [{ runId: "RUN-2026-0919-1234", script: "evil" }];
    jar.values.set("es_runs", Buffer.from(JSON.stringify(forged)).toString("base64url"));
    expect(await getRunEvents("RUN-2026-0919-1234")).toBeNull();
  });

  it("keeps the cookie under the browser size limit", async () => {
    for (let i = 0; i < 12; i++) {
      await createRun(request("Polysorbate 80"), new Date(t(i * 1000)));
    }
    expect((jar.values.get("es_runs") ?? "").length).toBeLessThanOrEqual(3600);
  });
});

describe("resolveRunIdentity", () => {
  it("resumes at Precedent and records who chose what, and when", async () => {
    const run = await createRun(request("Tween 80 HP-K"), T0);
    const at = t(I + 30_000);
    const resumed = await resolveRunIdentity(
      run.runId,
      { kind: "candidate", candidateId: "ps80" },
      at,
    );
    if (typeof resumed === "string") throw new Error(resumed);
    expect(statusesOf(resumed)).toEqual(["done", "active", "pending", "pending"]);
    expect(resumed.steps.identity.note).toBe("Polysorbate 80 · CAS 9005-65-6");
    expect(storedRuns()[0]?.resolution).toMatchObject({
      kind: "candidate",
      value: "ps80",
      by: "M. Otun",
      at,
    });
  });

  it("accepts a manual override", async () => {
    const run = await createRun(request("CCO"), T0);
    const resumed = await resolveRunIdentity(
      run.runId,
      { kind: "override", value: "64-17-5", format: "cas" },
      t(I),
    );
    if (typeof resumed === "string") throw new Error(resumed);
    expect(resumed.steps.identity.note).toBe("Override · CAS 64-17-5");
  });

  it("refuses unknown candidates, runs that aren't paused, and other users' runs", async () => {
    const run = await createRun(request("Tween 80 HP-K"), T0);
    const pick = { kind: "candidate", candidateId: "ps80" } as const;
    expect(await resolveRunIdentity(run.runId, { kind: "candidate", candidateId: "x" }, t(I))).toBe(
      "unknown_candidate",
    );
    expect(await resolveRunIdentity(run.runId, pick, t(10))).toBe("not_waiting");
    const happy = await createRun(request("Polysorbate 80"), T0);
    expect(await resolveRunIdentity(happy.runId, pick, t(I))).toBe("not_waiting");
    expect(await resolveRunIdentity("RUN-2026-0918-0999", pick)).toBe("not_found");
  });
});

describe("retryRunStep", () => {
  it("resumes at the failed step and keeps completed steps", async () => {
    const run = await createRun(request("Polysorbate 20"), T0);
    const failedAt = t(I + P + H + 5_000);
    const resumed = await retryRunStep(run.runId, "hazard", failedAt);
    if (typeof resumed === "string") throw new Error(resumed);
    expect(statusesOf(resumed)).toEqual(["done", "done", "active", "pending"]);
    expect((await getRunEvents(run.runId, failedAt + H + L))?.runState).toBe("complete");
  });

  it("refuses a retry when the step hasn't failed", async () => {
    const run = await createRun(request("Polysorbate 20"), T0);
    expect(await retryRunStep(run.runId, "hazard", t(10))).toBe("not_waiting");
    expect(await retryRunStep(run.runId, "identity", t(I + P + H + 10))).toBe("not_waiting");
  });
});
