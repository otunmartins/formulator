// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { RunSummary } from "@/lib/types/domain";
import { initialScreenState, screenReducer } from "./screenState";

const run: RunSummary = {
  runId: "RUN-2026-0916-0377",
  kind: "batch",
  title: "Batch · 4 excipients × 1N8Z Fab",
  route: null,
  context: null,
  createdAt: "2026-09-16T09:05:00Z",
  review: { status: "draft", version: 1 },
};

describe("screenReducer", () => {
  it("loads a run into the header and matches its mode", () => {
    const next = screenReducer(initialScreenState, { type: "loadRun", run });
    expect(next.header).toEqual({ kind: "run", run });
    expect(next.mode).toBe("batch");
  });

  it("clears a loaded run when the workspace changes", () => {
    const loaded = screenReducer(initialScreenState, { type: "loadRun", run });
    expect(screenReducer(loaded, { type: "workspaceChanged" }).header).toEqual({ kind: "empty" });
  });

  it("opening a drawer closes any open menu", () => {
    const withMenu = screenReducer(initialScreenState, { type: "setOpenMenu", menu: "recent" });
    const next = screenReducer(withMenu, { type: "openDrawer", drawer: "ask" });
    expect(next).toMatchObject({ drawer: "ask", openMenu: null });
  });

  it("dev states jump to each reference screen", () => {
    expect(screenReducer(initialScreenState, { type: "devState", state: "C01" }).openMenu).toBe(
      "recent",
    );
    expect(screenReducer(initialScreenState, { type: "devState", state: "C02" }).openMenu).toBe(
      "user",
    );
    const c03 = screenReducer(initialScreenState, { type: "devState", state: "C03" });
    expect(c03.panelCollapsed).toBe(true);
    expect(screenReducer(c03, { type: "devState", state: "S01" })).toEqual(initialScreenState);
  });
});
