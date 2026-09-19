"use client";

import { useTransition } from "react";
import { loadExample } from "@/app/actions/runs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { NOT_CONNECTED, useNotice } from "@/components/ui/Notice";
import { useRunInput } from "@/components/inputs/RunInputProvider";
import { useStartRun } from "@/components/run/useStartRun";
import { useScreen } from "./screenState";

/** The empty results card, shown until a run is loaded. */
export function EmptyState() {
  const { state, dispatch } = useScreen();
  const notify = useNotice();
  const runInput = useRunInput();
  const [loading, startTransition] = useTransition();
  const { start, pending: starting } = useStartRun();
  const pending = loading || starting;

  function onLoadExample() {
    dispatch({ type: "headerLoading", loading: true });
    startTransition(async () => {
      const result = await loadExample();
      if (result.ok) {
        const { example, structure, identity } = result.data;
        // Fill the panel so the inputs match the run, then start it straight away.
        runInput.load(example.input, structure, identity);
        start(example.input);
      } else {
        dispatch({ type: "headerLoading", loading: false });
        notify(result.error.message, "error");
      }
    });
  }

  return (
    <Card className="flex min-h-[340px] flex-col items-center justify-center px-6 py-12 text-center">
      <Icon name="structure" className="size-10 text-muted" />
      {state.mode === "single" ? (
        <>
          <h2 className="mt-3 text-base font-semibold">No screen yet</h2>
          <p className="mt-2 max-w-md text-[13px] text-muted">
            Enter an excipient, a protein and the context on the left, then choose Run screen.
            Sections fill in as each step completes.
          </p>
          <Button size="sm" className="mt-4" onClick={onLoadExample} disabled={pending}>
            Load example: polysorbate 80 × 1N8Z Fab
          </Button>
        </>
      ) : (
        <>
          {/* TODO(build-09): CSV upload, comparison matrix and reused dossier. */}
          <h2 className="mt-3 text-base font-semibold">No batch yet</h2>
          <p className="mt-2 max-w-md text-[13px] text-muted">
            Batch screening is {NOT_CONNECTED.toLowerCase()}.
          </p>
        </>
      )}
    </Card>
  );
}
