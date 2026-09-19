"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
}

export interface SegmentedProps<T extends string> {
  /** Accessible name for the group. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}

/** A row of toggle buttons (aria-pressed), e.g. Single | Batch or SC | IV | IM. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-control border border-border bg-bg p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-[5px] px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed",
              selected
                ? "border border-border-strong bg-surface text-text shadow-xs"
                : "border border-transparent text-muted hover:text-text",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
