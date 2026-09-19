"use client";

import { createContext, useContext, type Dispatch } from "react";
import type { Example, Mode, RunSummary } from "@/lib/types/domain";

// Screen-wide UI state (foundation state model), held in one reducer so later builds
// extend it instead of drilling props. TODO(build-03): run state and steps.

export type LoadedHeader =
  { kind: "empty" } | { kind: "example"; example: Example } | { kind: "run"; run: RunSummary };

export type DevState = "S01" | "C01" | "C02" | "C03";
export type OpenMenu = "recent" | "user" | null;

export interface ScreenState {
  mode: Mode;
  panelCollapsed: boolean;
  header: LoadedHeader;
  drawer: "ask" | "manifest" | null;
  openMenu: OpenMenu;
}

export type ScreenAction =
  | { type: "setMode"; mode: Mode }
  | { type: "setPanelCollapsed"; collapsed: boolean }
  | { type: "loadRun"; run: RunSummary }
  | { type: "loadExample"; example: Example }
  | { type: "workspaceChanged" }
  | { type: "openDrawer"; drawer: "ask" | "manifest" }
  | { type: "closeDrawer" }
  | { type: "setOpenMenu"; menu: OpenMenu }
  | { type: "devState"; state: DevState };

export const initialScreenState: ScreenState = {
  mode: "single",
  panelCollapsed: false,
  header: { kind: "empty" },
  drawer: null,
  openMenu: null,
};

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case "setMode":
      return { ...state, mode: action.mode };
    case "setPanelCollapsed":
      return { ...state, panelCollapsed: action.collapsed };
    case "loadRun":
      return { ...state, mode: action.run.kind, header: { kind: "run", run: action.run } };
    case "loadExample":
      return { ...state, mode: "single", header: { kind: "example", example: action.example } };
    case "workspaceChanged":
      // A loaded run belonged to the previous workspace; start a fresh screen.
      return { ...state, header: { kind: "empty" }, openMenu: null };
    case "openDrawer":
      return { ...state, drawer: action.drawer, openMenu: null };
    case "closeDrawer":
      return { ...state, drawer: null };
    case "setOpenMenu":
      return { ...state, openMenu: action.menu };
    case "devState":
      return devState(state, action.state);
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

/** Jumps to a reference screen for review (dev-only switcher). */
function devState(state: ScreenState, target: DevState): ScreenState {
  switch (target) {
    case "S01":
      return initialScreenState;
    case "C01":
      return { ...state, drawer: null, panelCollapsed: false, openMenu: "recent" };
    case "C02":
      return { ...state, drawer: null, panelCollapsed: false, openMenu: "user" };
    case "C03":
      return { ...state, drawer: null, panelCollapsed: true, openMenu: null };
    default: {
      const unreachable: never = target;
      return unreachable;
    }
  }
}

export const ScreenContext = createContext<{
  state: ScreenState;
  dispatch: Dispatch<ScreenAction>;
} | null>(null);

export function useScreen() {
  const ctx = useContext(ScreenContext);
  if (!ctx) throw new Error("useScreen must be used inside <Screen>");
  return ctx;
}
