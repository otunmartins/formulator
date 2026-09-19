"use client";

import { useCallback, useTransition } from "react";
import { startRun } from "@/app/actions/runs";
import { useNotice } from "@/components/ui/Notice";
import type { RunRequest } from "@/lib/types/runInput";
import { useScreen } from "@/components/shell/screenState";

/** Starts a run with validated input and loads it into the screen (the panel, Load example). */
export function useStartRun() {
  const { dispatch } = useScreen();
  const notify = useNotice();
  const [pending, startTransition] = useTransition();

  const start = useCallback(
    (request: RunRequest) => {
      dispatch({ type: "headerLoading", loading: true });
      startTransition(async () => {
        const response = await startRun(request);
        if (response.ok) {
          dispatch({ type: "loadRun", run: response.data });
        } else {
          dispatch({ type: "headerLoading", loading: false });
          notify(response.error.message, "error");
        }
      });
    },
    [dispatch, notify],
  );

  return { start, pending };
}
