"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { SkeletonMatrix } from "@/components/run/SkeletonMatrix";
import { useScreen } from "@/components/shell/screenState";
import { NovelBanner } from "./NovelBanner";
import { useDossier } from "./useDossier";
import { VerdictMatrix } from "./VerdictMatrix";

export interface DossierSectionProps {
  /** Header line for partial results, e.g. "Precedent endpoints only · hazard step failed". */
  partialNote?: string;
}

/**
 * The verdict matrix for a run with results (S07, S15, and partial under S06), with its
 * loading and error states. TODO(build-05, build-06): the liability map and simulation card
 * sit below this on a complete run.
 */
export function DossierSection({ partialNote }: DossierSectionProps) {
  const { state, dispatch } = useScreen();
  const { status, retry } = useDossier();
  const { dossier } = state;

  if (status === "error") {
    return (
      <Card role="alert" className="flex items-center gap-3 px-6 py-5 text-[13px]">
        <Icon name="triangle-alert" className="size-4 shrink-0 text-alert-text" />
        <p className="flex-1">The verdict matrix couldn&apos;t be loaded. Your results are kept.</p>
        <Button size="sm" onClick={retry}>
          <Icon name="refresh" className="size-3.5" />
          Try again
        </Button>
      </Card>
    );
  }
  if (!dossier) return <SkeletonMatrix step={4} />;

  return (
    <>
      {dossier.novelForRoute && <NovelBanner excipient={dossier.excipient} route={dossier.route} />}
      <VerdictMatrix
        dossier={dossier}
        {...(dossier.partial && partialNote ? { note: partialNote } : {})}
        expandedIds={state.selectedEndpointIds}
        onToggle={(id) => dispatch({ type: "toggleEndpoint", id })}
      />
    </>
  );
}
