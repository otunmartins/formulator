"use client";

import { DossierSection } from "@/components/dossier/DossierSection";
import { EmptyState } from "@/components/shell/EmptyState";
import { useScreen } from "@/components/shell/screenState";
import { stepKeys, type Steps } from "@/lib/types/domain";
import { IdentityResolver } from "./IdentityResolver";
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
 * paused (S05), the error banner with the completed steps' endpoints when a step fails (S06),
 * and the verdict matrix when complete (S07, S15).
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
          <DossierSection
            partialNote={`Precedent endpoints only · ${STEP_TITLES[events.failure.step].toLowerCase()} step failed`}
          />
        </>
      ) : events?.runState === "complete" ? (
        <DossierSection />
      ) : (
        <SkeletonMatrix step={events ? currentStepNumber(events.steps) : 1} />
      )}
    </>
  );
}
