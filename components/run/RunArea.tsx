"use client";

import { EmptyState } from "@/components/shell/EmptyState";
import { useScreen } from "@/components/shell/screenState";
import { stepKeys, type Steps } from "@/lib/types/domain";
import { ProgressStrip } from "./ProgressStrip";
import { SkeletonMatrix } from "./SkeletonMatrix";
import { useRunEvents } from "./useRunEvents";

/** 1-based index of the step the run is on (active or waiting for input), else the last. */
export function currentStepNumber(steps: Steps): number {
  const index = stepKeys.findIndex(
    (key) => steps[key].status === "active" || steps[key].status === "needs_input",
  );
  return index === -1 ? stepKeys.length : index + 1;
}

/**
 * The run's progress strip and whatever sits under it for the loaded run's state: the empty
 * card before a run, a skeleton matrix while it runs (S04).
 */
export function RunArea() {
  useRunEvents();
  const { state } = useScreen();
  const { events } = state;
  const hasRun = state.header.kind === "run";

  return (
    <>
      <ProgressStrip steps={hasRun ? (events?.steps ?? null) : null} />
      {!hasRun ? (
        <EmptyState />
      ) : (
        <SkeletonMatrix step={events ? currentStepNumber(events.steps) : 1} />
      )}
    </>
  );
}
