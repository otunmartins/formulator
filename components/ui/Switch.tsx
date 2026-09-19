"use client";

import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** ID of the region the switch shows or hides. */
  controls?: string;
  className?: string;
}

/** On/off switch (role="switch"); the visible label names it. */
export function Switch({ label, checked, onChange, disabled, controls, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-controls={controls}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-control text-[13px] font-semibold text-text disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-accent bg-accent" : "border-border-strong bg-bg",
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-surface shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}
