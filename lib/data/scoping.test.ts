// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth/session";
import { createCookieJar } from "@/tests/helpers/cookieJar";

const session: { current: Session } = {
  current: {
    user: { id: "usr_motun", name: "M. Otun", initials: "MO" },
    workspaceIds: ["wsp_formulation", "wsp_discovery"],
    workspaceId: "wsp_formulation",
  },
};

const jar = createCookieJar();
vi.mock("next/headers", () => ({ cookies: async () => jar.store }));
vi.mock("@/lib/auth/session", () => ({ getSession: async () => session.current }));

const { listRecentRuns, getRunSummary, getRunEvents } = await import("./runs");
const { listWorkspaces } = await import("./workspaces");

function asUser(userId: string, workspaceIds: string[], workspaceId: string) {
  session.current = {
    user: { id: userId, name: userId === "usr_motun" ? "M. Otun" : userId, initials: "XX" },
    workspaceIds,
    workspaceId,
  };
}

beforeEach(() => asUser("usr_motun", ["wsp_formulation", "wsp_discovery"], "wsp_formulation"));

describe("listRecentRuns", () => {
  it("lists the active workspace's runs, newest first", async () => {
    const runs = await listRecentRuns();
    expect(runs.map((r) => r.runId)).toEqual([
      "RUN-2026-0918-0412",
      "RUN-2026-0917-0398",
      "RUN-2026-0916-0377",
      "RUN-2026-0912-0341",
    ]);
  });

  it("changes when the workspace changes", async () => {
    asUser("usr_motun", ["wsp_formulation", "wsp_discovery"], "wsp_discovery");
    const runs = await listRecentRuns();
    expect(runs.map((r) => r.runId)).toEqual(["RUN-2026-0915-0360", "RUN-2026-0910-0322"]);
  });

  it("never returns another user's runs", async () => {
    const runs = await listRecentRuns();
    expect(runs.some((r) => r.runId === "RUN-2026-0918-0999")).toBe(false);
  });

  it("doesn't expose owner fields", async () => {
    const [run] = await listRecentRuns();
    expect(run).not.toHaveProperty("ownerId");
    expect(run).not.toHaveProperty("workspaceId");
  });
});

describe("getRunSummary", () => {
  it("finds a run in the active workspace", async () => {
    expect((await getRunSummary("RUN-2026-0918-0412"))?.title).toBe("Polysorbate 80 × 1N8Z Fab");
  });

  it("doesn't find another user's run by guessing its ID", async () => {
    expect(await getRunSummary("RUN-2026-0918-0999")).toBeNull();
    expect(await getRunEvents("RUN-2026-0918-0999")).toBeNull();
  });

  it("doesn't find the user's own run from another workspace", async () => {
    asUser("usr_motun", ["wsp_formulation", "wsp_discovery"], "wsp_discovery");
    expect(await getRunSummary("RUN-2026-0918-0412")).toBeNull();
  });

  it("the other user can't see usr_motun's runs either", async () => {
    asUser("usr_other", ["wsp_other"], "wsp_other");
    expect(await getRunSummary("RUN-2026-0918-0412")).toBeNull();
    expect((await listRecentRuns()).map((r) => r.runId)).toEqual(["RUN-2026-0918-0999"]);
  });
});

describe("getRunEvents", () => {
  it("shows a finished fixture run as complete (Build 03 replays mock scripts)", async () => {
    const events = await getRunEvents("RUN-2026-0918-0412");
    expect(events?.runState).toBe("complete");
    expect(Object.values(events?.steps ?? {}).map((s) => s.status)).toEqual([
      "done",
      "done",
      "done",
      "done",
    ]);
  });
});

describe("listWorkspaces", () => {
  it("lists only the session user's workspaces", async () => {
    const { workspaces, activeId, user } = await listWorkspaces();
    expect(user.name).toBe("M. Otun");
    expect(activeId).toBe("wsp_formulation");
    expect(workspaces.map((w) => w.name)).toEqual([
      "Algonix AI · Formulation",
      "Algonix AI · Discovery",
    ]);
  });
});
