"use client";

import { useTransition } from "react";
import { retryStep } from "@/app/actions/runs";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useNotice } from "@/components/ui/Notice";
import { useScreen } from "@/components/shell/screenState";
import { stepKeys } from "@/lib/types/domain";
import type { StepFailure } from "@/lib/types/runEvents";
import { focusProgressStrip, STEP_TITLES } from "./ProgressStrip";

export interface StepErrorBannerProps {
  runId: string;
  failure: StepFailure;
}

/** S06: a step failed after retries. Retry resumes at that step; completed steps are kept. */
export function StepErrorBanner({ runId, failure }: StepErrorBannerProps) {
  const { dispatch } = useScreen();
  const notify = useNotice();
  const [pending, startTransition] = useTransition();
  const title = STEP_TITLES[failure.step];
  // The step before the failed one is the last that completed (S06: "Precedent results…").
  const previous = stepKeys[stepKeys.indexOf(failure.step) - 1];
  const kept = previous
    ? `${STEP_TITLES[previous]} results below are complete.`
    : "No steps completed.";

  function onRetry() {
    startTransition(async () => {
      const result = await retryStep({ runId, step: failure.step });
      if (result.ok) {
        dispatch({ type: "runResumed", events: result.data });
        focusProgressStrip();
      } else {
        notify(result.error.message, "error");
      }
    });
  }

  return (
    <div
      role="alert"
      className="mb-5 flex animate-reveal items-start gap-3 rounded-card border border-alert-border bg-alert-fill px-5 py-4"
    >
      <Icon name="circle-x" className="mt-0.5 size-4 shrink-0 text-alert-text" />
      <div className="min-w-0 flex-1 text-[13px]">
        <p className="font-semibold text-alert-text">{title} step failed</p>
        <p className="mt-0.5">
          {failure.reason} (<span className="font-mono text-xs">{failure.detail}</span>). {kept}{" "}
          {title} endpoints and the liability map are not shown.
        </p>
      </div>
      <Button size="sm" onClick={onRetry} disabled={pending}>
        <Icon name="refresh" className="size-3.5" />
        {pending ? "Retrying…" : `Retry ${title.toLowerCase()} step`}
      </Button>
    </div>
  );
}
