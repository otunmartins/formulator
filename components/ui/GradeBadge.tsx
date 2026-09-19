"use client";

import { useId, useState } from "react";
import type { Grade } from "@/lib/types/domain";
import { cn } from "@/lib/utils/cn";
import { GRADE_ORDER, GRADES } from "@/lib/utils/verdicts";

export interface GradeBadgeProps {
  grade: Grade;
  className?: string;
}

/** Mono evidence-grade badge. The A–E legend shows on hover and on keyboard focus. */
export function GradeBadge({ grade, className }: GradeBadgeProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className={cn("relative inline-flex", className)}>
      <button
        type="button"
        aria-label={`Evidence grade ${grade}`}
        aria-describedby={tooltipId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="inline-flex size-6 items-center justify-center rounded-[5px] border border-border-strong bg-surface font-mono text-xs font-semibold text-text"
      >
        {grade}
      </button>
      <span
        role="tooltip"
        id={tooltipId}
        hidden={!open}
        className="absolute top-full left-0 z-30 mt-1.5 w-72 rounded-control border border-border bg-surface p-2.5 text-xs shadow-lg"
      >
        <span className="mb-1.5 block font-semibold">Evidence grade</span>
        {GRADE_ORDER.map((g) => (
          <span
            key={g}
            className={cn(
              "flex gap-2 rounded px-1 py-0.5",
              g === grade ? "bg-accent-soft font-medium text-text" : "text-muted",
            )}
          >
            <span className="font-mono font-semibold">{g}</span>
            <span>{GRADES[g]}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
