"use client";

import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { NOT_CONNECTED, useNotice } from "@/components/ui/Notice";
import { reviewLabel } from "@/lib/utils/format";
import { useScreen } from "./screenState";

/**
 * Sticky review and export bar. Export and Share need results (partial results after a failed
 * step count, S06); Sign off needs a complete run. TODO(build-07): sign-off dialog, versions,
 * manifest drawer and export stubs.
 */
export function ReviewBar() {
  const { state } = useScreen();
  const notify = useNotice();
  const runState = state.header.kind === "run" ? state.events?.runState : undefined;
  const complete = runState === "complete";
  const hasResults = complete || runState === "error";
  const stub = () => notify(NOT_CONNECTED);
  const review =
    state.header.kind === "run"
      ? state.header.run.review
      : { status: "draft" as const, version: 1 };
  const signed = review.status === "signed";

  return (
    <div
      role="region"
      aria-label="Review and export"
      className="sticky bottom-footer z-20 flex items-center gap-3 border-t border-border bg-surface px-6 py-3 pr-14 desk:px-8 desk:pr-16"
    >
      <Chip tone={signed ? "signed" : "neutral"} icon={signed ? "circle-check" : "pencil"}>
        {reviewLabel(review)}
      </Chip>
      <Button variant="primary" size="sm" disabled={!complete || signed} onClick={stub}>
        Sign off
      </Button>
      <Button variant="link" disabled>
        Run manifest
      </Button>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" disabled={!hasResults} onClick={stub}>
          <Icon name="download" className="size-3.5" />
          Export PDF
        </Button>
        <Button size="sm" disabled={!hasResults} onClick={stub}>
          <Icon name="download" className="size-3.5" />
          Export DOCX
        </Button>
        <Button size="sm" disabled={!hasResults} onClick={stub}>
          <Icon name="link" className="size-3.5" />
          Copy share link
        </Button>
      </div>
    </div>
  );
}
