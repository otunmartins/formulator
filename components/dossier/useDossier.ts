"use client";

import { useCallback, useEffect, useState } from "react";
import { useScreen } from "@/components/shell/screenState";
import type { Dossier } from "@/lib/types/dossier";

export type DossierStatus = "idle" | "loading" | "error";

/**
 * Fetches the loaded run's verdict matrix once the run settles with results: complete, or
 * partial after a failed step. A resume or retry clears it, so it is fetched again when the
 * run settles next time.
 */
export function useDossier(): { status: DossierStatus; retry: () => void } {
  const { state, dispatch } = useScreen();
  const [attempt, setAttempt] = useState(0);
  // The request that failed; status is derived from it rather than set inside the effect.
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const runId = state.header.kind === "run" ? state.header.run.runId : null;
  const runState = state.events?.runState;
  const wanted = Boolean(runId) && (runState === "complete" || runState === "error");
  const loaded = state.dossier !== null;
  const key = `${runId}:${runState}:${attempt}`;

  useEffect(() => {
    if (!wanted || loaded) return;
    let cancelled = false;
    fetch(`/api/runs/${runId}/dossier`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const dossier = (await response.json()) as Dossier;
        if (!cancelled) dispatch({ type: "dossierLoaded", dossier });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [wanted, loaded, runId, key, dispatch]);

  const retry = useCallback(() => {
    setFailedKey(null);
    setAttempt((n) => n + 1);
  }, []);

  let status: DossierStatus = "idle";
  if (failedKey === key) status = "error";
  else if (wanted && !loaded) status = "loading";
  return { status, retry };
}
