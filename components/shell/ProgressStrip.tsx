"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { stepKeys, type StepKey, type StepStatus } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";

const STEP_TITLES: Record<StepKey, string> = {
  identity: "Identity",
  precedent: "Precedent",
  hazard: "Hazard",
  liability: "Liability map",
};

const STATUS: Record<StepStatus, { label: string; icon: IconName; className: string }> = {
  pending: { label: "Waiting", icon: "circle-dashed", className: "text-muted" },
  active: { label: "Running", icon: "clock", className: "text-accent" },
  done: { label: "Done", icon: "circle-check", className: "text-prec-text" },
  error: { label: "Failed", icon: "triangle-alert", className: "text-alert-text" },
  needs_input: { label: "Needs input", icon: "info", className: "text-gap-text" },
};

/**
 * The four run steps, each as icon + text. Build 01 shows every step as Waiting.
 * TODO(build-03): steps and notes from polled run events.
 */
export function ProgressStrip() {
  const status: StepStatus = "pending";

  return (
    <ol aria-label="Run progress" aria-live="polite" className="mb-5 grid grid-cols-4 gap-3">
      {stepKeys.map((key, index) => {
        const s = STATUS[status];
        return (
          <li
            key={key}
            className="flex items-center gap-3 rounded-card border border-border bg-surface-subtle px-4 py-3"
          >
            <Icon name={s.icon} className={cn("size-5", s.className)} />
            <span className="min-w-0">
              <span className="block text-[13px] leading-snug font-semibold">
                {index + 1}. {STEP_TITLES[key]}
              </span>
              <span className="block truncate text-xs text-muted">{s.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
