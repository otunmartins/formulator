"use client";

import { createContext, useContext, type Dispatch } from "react";
import type { Mode, RunSummary } from "@/lib/types/domain";
import type { RunEvents } from "@/lib/types/runEvents";

// Screen-wide UI state (foundation state model), held in one reducer so later builds
// extend it instead of drilling props.

export type LoadedHeader = { kind: "empty" } | { kind: "run"; run: RunSummary };

export type DevState = "S01" | "C01" | "C02" | "C03" | "S04" | "S05" | "S06";
export type OpenMenu = "recent" | "user" | null;

export interface ScreenState {
  mode: Mode;
  panelCollapsed: boolean;
  header: LoadedHeader;
  /** True while a run is being started or opened into the header. */
  headerLoading: boolean;
  /** The loaded run's latest progress from the events route; null until the first poll. */
  events: RunEvents | null;
  /** Bumped to (re)start polling, e.g. after "Use and continue" or "Retry". */
  pollKey: number;
  drawer: "ask" | "manifest" | null;
  openMenu: OpenMenu;
}

export type ScreenAction =
  | { type: "setMode"; mode: Mode }
  | { type: "setPanelCollapsed"; collapsed: boolean }
  | { type: "headerLoading"; loading: boolean }
  | { type: "loadRun"; run: RunSummary }
  | { type: "runEvents"; events: RunEvents }
  /** The run moved on after a user action (resolve or retry): show it and poll again. */
  | { type: "runResumed"; events: RunEvents }
  | { type: "workspaceChanged" }
  | { type: "openDrawer"; drawer: "ask" | "manifest" }
  | { type: "closeDrawer" }
  | { type: "setOpenMenu"; menu: OpenMenu }
  | { type: "devState"; state: DevState };

export const initialScreenState: ScreenState = {
  mode: "single",
  panelCollapsed: false,
  header: { kind: "empty" },
  headerLoading: false,
  events: null,
  pollKey: 0,
  drawer: null,
  openMenu: null,
};

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case "setMode":
      return { ...state, mode: action.mode };
    case "setPanelCollapsed":
      return { ...state, panelCollapsed: action.collapsed };
    case "headerLoading":
      return { ...state, headerLoading: action.loading };
    case "loadRun":
      return {
        ...state,
        mode: action.run.kind,
        header: { kind: "run", run: action.run },
        headerLoading: false,
        events: null,
        pollKey: state.pollKey + 1,
      };
    case "runEvents":
      // Ignore a late response for a run that is no longer loaded.
      if (state.header.kind !== "run" || state.header.run.runId !== action.events.runId) {
        return state;
      }
      return { ...state, events: action.events };
    case "runResumed":
      if (state.header.kind !== "run" || state.header.run.runId !== action.events.runId) {
        return state;
      }
      return { ...state, events: action.events, pollKey: state.pollKey + 1 };
    case "workspaceChanged":
      // A loaded run belonged to the previous workspace; start a fresh screen.
      return {
        ...state,
        header: { kind: "empty" },
        headerLoading: false,
        events: null,
        openMenu: null,
      };
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
    // S04–S06 start a real (backdated) mock run; see DevStateSwitcher.
    case "S04":
    case "S05":
    case "S06":
      return { ...state, drawer: null, panelCollapsed: false, openMenu: null };
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
