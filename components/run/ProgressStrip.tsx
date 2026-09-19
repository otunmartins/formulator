"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { stepKeys, type StepKey, type StepStatus, type Steps } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";

export const STEP_TITLES: Record<StepKey, string> = {
  identity: "Identity",
  precedent: "Precedent",
  hazard: "Hazard",
  liability: "Liability map",
};

interface StatusStyle {
  /** Read by screen readers before the note, since a done note ("6 sources") isn't a status. */
  label: string;
  icon: IconName;
  iconClass: string;
  cardClass: string;
}

const STATUS: Record<StepStatus, StatusStyle> = {
  pending: {
    label: "Waiting",
    icon: "circle-dashed",
    iconClass: "text-muted",
    cardClass: "border-border bg-surface-subtle",
  },
  active: {
    label: "Running",
    icon: "spinner",
    iconClass: "animate-spin text-accent",
    cardClass: "border-accent bg-surface ring-1 ring-accent",
  },
  done: {
    label: "Done",
    icon: "circle-check",
    iconClass: "animate-tick text-prec-text",
    cardClass: "border-border bg-surface",
  },
  error: {
    label: "Failed",
    icon: "circle-x",
    iconClass: "text-alert-text",
    cardClass: "border-alert-border bg-alert-fill",
  },
  needs_input: {
    label: "Needs your input",
    icon: "triangle-alert",
    iconClass: "text-gap-text",
    cardClass: "border-gap-border bg-gap-fill",
  },
};

/** The strip's id: focus moves here when the card or banner the user acted on goes away. */
export const PROGRESS_STRIP_ID = "run-progress";

/** Keeps focus in place after "Use and continue" or "Retry" removes the focused control. */
export function focusProgressStrip() {
  requestAnimationFrame(() => document.getElementById(PROGRESS_STRIP_ID)?.focus());
}

export interface ProgressStripProps {
  /** Null before a run starts: every step shows as waiting. */
  steps: Steps | null;
}

/** The four run steps, each as icon + text (never colour alone), announced as they change. */
export function ProgressStrip({ steps }: ProgressStripProps) {
  return (
    <ol
      id={PROGRESS_STRIP_ID}
      tabIndex={-1}
      aria-label="Run progress"
      aria-live="polite"
      className="mb-5 grid grid-cols-4 gap-3"
    >
      {stepKeys.map((key, index) => {
        const step = steps?.[key] ?? { status: "pending" as const, note: "Waiting" };
        const style = STATUS[step.status];
        const note = step.note ?? style.label;
        return (
          <li
            key={key}
            className={cn("flex items-center gap-3 rounded-card border px-4 py-3", style.cardClass)}
          >
            {/* Keyed by status so the tick plays once, when the step completes. */}
            <Icon key={step.status} name={style.icon} className={cn("size-5", style.iconClass)} />
            <span className="min-w-0">
              <span className="block text-[13px] leading-snug font-semibold">
                {index + 1}. {STEP_TITLES[key]}
              </span>
              <span
                className="line-clamp-2 text-xs break-words text-muted desk:line-clamp-1"
                title={note}
              >
                {note !== style.label && <span className="sr-only">{style.label}: </span>}
                {note}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
