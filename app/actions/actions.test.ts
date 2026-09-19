// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/cache", () => ({ refresh }));
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

const { openRun, loadExample } = await import("./runs");
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
    expect(result.ok && result.data.context.route).toBe("SC");
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
