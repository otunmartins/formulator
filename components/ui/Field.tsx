"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

/** Props a Field passes to its control so label, hint and error are wired up. */
export interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

export interface FieldProps {
  label: string;
  /** Muted help text under the control. */
  hint?: ReactNode;
  /** Inline error; replaces nothing, shown under the control with an icon. */
  error?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Label + control + hint + inline error, with aria-describedby / aria-invalid wired up. */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text">
        {label}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1 text-xs text-alert-text">
      <Icon name="triangle-alert" className="mt-px size-3.5" />
      <span>{children}</span>
    </p>
  );
}
