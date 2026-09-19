"use client";

import { useEffect } from "react";
import { useNotice } from "@/components/ui/Notice";
import type { RunEvents } from "@/lib/types/runEvents";
import { useScreen } from "@/components/shell/screenState";

export const POLL_MS = 1500;

/** Tablet widths, where the input panel collapses once a run completes (Build 01 note). */
const TABLET_QUERY = "(max-width: 1180px)";

/**
 * Polls the events route for the loaded run every 1.5 s (foundation: 1–2 s, no streams).
 * Stops when the run settles (complete, paused for identity, or failed), when another run is
 * loaded, or on unmount; `pollKey` restarts it after "Use and continue" or "Retry".
 */
export function useRunEvents() {
  const { state, dispatch } = useScreen();
  const notify = useNotice();
  const runId = state.header.kind === "run" ? state.header.run.runId : null;
  const { pollKey } = state;

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const response = await fetch(`/api/runs/${runId}/events`, { cache: "no-store" });
        if (cancelled) return;
        if (response.status === 404) {
          notify("This run is no longer available in your workspace.", "error");
          return;
        }
        // Other client errors won't fix themselves; server errors may, so keep polling those.
        if (response.status >= 400 && response.status < 500) {
          notify("Progress for this run couldn't be loaded.", "error");
          return;
        }
        if (response.ok) {
          const events = (await response.json()) as RunEvents;
          if (cancelled) return;
          dispatch({ type: "runEvents", events });
          if (events.runState === "complete" && window.matchMedia(TABLET_QUERY).matches) {
            dispatch({ type: "setPanelCollapsed", collapsed: true });
          }
          if (events.settled) return;
        }
      } catch {
        // Network blip: keep polling; the next tick usually succeeds.
      }
      if (!cancelled) timer = window.setTimeout(poll, POLL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [runId, pollKey, dispatch, notify]);
}
