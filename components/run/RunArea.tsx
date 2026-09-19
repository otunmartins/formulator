"use client";

import { EmptyState } from "@/components/shell/EmptyState";
import { useScreen } from "@/components/shell/screenState";
import { stepKeys, type Steps } from "@/lib/types/domain";
import { IdentityResolver } from "./IdentityResolver";
import { MatrixHandoff } from "./MatrixHandoff";
import { ProgressStrip, STEP_TITLES } from "./ProgressStrip";
import { SkeletonMatrix } from "./SkeletonMatrix";
import { StepErrorBanner } from "./StepErrorBanner";
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
 * card before a run, a skeleton matrix while it runs (S04), the identity card while it is
 * paused (S05), the error banner with the completed results when a step fails (S06), and the
 * matrix hand-off to Build 04 when complete.
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
      ) : events?.runState === "identity_unresolved" ? (
        <IdentityResolver
          key={events.runId}
          runId={events.runId}
          query={events.query}
          candidates={events.candidates ?? []}
        />
      ) : events?.runState === "error" && events.failure ? (
        <>
          <StepErrorBanner runId={events.runId} failure={events.failure} />
          {/* TODO(build-05, build-06): the liability map and simulation stay hidden here. */}
          <MatrixHandoff
            scope="precedent"
            note={`Precedent endpoints only · ${STEP_TITLES[events.failure.step].toLowerCase()} step failed`}
          />
        </>
      ) : events?.runState === "complete" ? (
        <MatrixHandoff scope="all" note="All steps complete" />
      ) : (
        <SkeletonMatrix step={events ? currentStepNumber(events.steps) : 1} />
      )}
    </>
  );
}
