// @vitest-environment node
import { describe, expect, it } from "vitest";
import { STEP_MS, timelineAt, type StoredRun } from "./runScripts";

const T0 = 1_000_000;
const { identity: I, precedent: P, hazard: H, liability: L } = STEP_MS;

function run(overrides: Partial<StoredRun> = {}): StoredRun {
  return {
    runId: "RUN-2026-0919-5000",
    kind: "single",
    title: "Polysorbate 80 × 1N8Z Fab",
    route: "SC",
    context: null,
    createdAt: "2026-09-19T10:00:00.000Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_formulation",
    script: "happy",
    query: "Polysorbate 80",
    notes: {
      identity: "Polysorbate 80 · CAS 9005-65-6",
      precedent: "6 sources",
      hazard: "8 endpoints",
      liability: "4 sites on 1N8Z",
    },
    startedAt: T0,
    endpointSet: "ps80",
    retries: [],
    ...overrides,
  };
}

const statuses = (e: ReturnType<typeof timelineAt>) => Object.values(e.steps).map((s) => s.status);

describe("happy path", () => {
  it("moves through identity → precedent → hazard → liability", () => {
    expect(statuses(timelineAt(run(), T0))).toEqual(["active", "pending", "pending", "pending"]);
    const mid = timelineAt(run(), T0 + I + P + 10);
    expect(statuses(mid)).toEqual(["done", "done", "active", "pending"]);
    expect(mid.steps.identity.note).toBe("Polysorbate 80 · CAS 9005-65-6");
    expect(mid.steps.precedent.note).toBe("6 sources");
    expect(mid.steps.hazard.note).toBe("Running…");
    expect(mid).toMatchObject({ runState: "running", settled: false });
  });

  it("completes after the last step", () => {
    const end = timelineAt(run(), T0 + I + P + H + L);
    expect(statuses(end)).toEqual(["done", "done", "done", "done"]);
    expect(end).toMatchObject({ runState: "complete", settled: true });
  });
});

describe("identity unresolved", () => {
  const unresolved = run({ script: "unresolved", query: "Tween 80 HP-K" });

  it("pauses at identity with candidates instead of failing", () => {
    const paused = timelineAt(unresolved, T0 + I + 60_000);
    expect(statuses(paused)).toEqual(["needs_input", "pending", "pending", "pending"]);
    expect(paused.runState).toBe("identity_unresolved");
    expect(paused.failure).toBeUndefined();
    expect(paused.candidates?.map((c) => c.name)).toEqual([
      "Polysorbate 80",
      "Polysorbate 80, high-purity grade",
    ]);
  });

  it("gives other unmatched names no candidates (override only)", () => {
    const other = timelineAt(run({ script: "unresolved", query: "CCO" }), T0 + I);
    expect(other.candidates).toEqual([]);
  });

  it("resumes at Precedent from the moment of resolution", () => {
    const R = T0 + 90_000;
    const resolved = run({
      script: "unresolved",
      query: "Tween 80 HP-K",
      resolution: {
        at: R,
        kind: "candidate",
        value: "ps80",
        note: "Polysorbate 80 · CAS 9005-65-6",
        by: "M. Otun",
      },
    });
    const justAfter = timelineAt(resolved, R + 10);
    expect(statuses(justAfter)).toEqual(["done", "active", "pending", "pending"]);
    expect(justAfter.steps.identity.note).toBe("Polysorbate 80 · CAS 9005-65-6");
    expect(timelineAt(resolved, R + P + H + L).runState).toBe("complete");
  });
});

describe("hazard failure", () => {
  const failing = run({ script: "hazard_fail", query: "Polysorbate 20" });
  const failedAt = T0 + I + P + H;

  it("fails the hazard step and keeps identity and precedent done", () => {
    const failed = timelineAt(failing, failedAt + 5_000);
    expect(statuses(failed)).toEqual(["done", "done", "error", "pending"]);
    expect(failed.steps.hazard.note).toBe("Failed · HTTP 504");
    expect(failed).toMatchObject({
      runState: "error",
      settled: true,
      failure: { step: "hazard", detail: "HTTP 504, 3 attempts" },
    });
  });

  it("retry resumes at the failed step only; completed steps are not re-run", () => {
    const R = failedAt + 30_000;
    const retried = { ...failing, retries: [{ step: "hazard" as const, at: R }] };
    const right = timelineAt(retried, R + 10);
    // Identity and precedent stay done straight away: they are not replayed.
    expect(statuses(right)).toEqual(["done", "done", "active", "pending"]);
    const done = timelineAt(retried, R + H + L);
    expect(done.runState).toBe("complete");
    expect(done).not.toHaveProperty("failure");
  });

  it("ignores a retry recorded before the step failed", () => {
    const early = { ...failing, retries: [{ step: "hazard" as const, at: T0 }] };
    expect(timelineAt(early, failedAt + 10).runState).toBe("error");
  });
});
