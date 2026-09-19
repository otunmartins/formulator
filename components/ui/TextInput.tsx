import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { controlClassName } from "./controlStyles";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Monospace, for SMILES, IDs and numeric data. */
  mono?: boolean;
  /** Unit shown at the right edge, e.g. "mg/mL"; added to the input's description. */
  unit?: string;
}

export function TextInput({ mono, unit, className, type = "text", ...rest }: TextInputProps) {
  const unitId = unit && rest.id ? `${rest.id}-unit` : undefined;
  const describedBy = [rest["aria-describedby"], unitId].filter(Boolean).join(" ") || undefined;
  const input = (
    <input
      type={type}
      spellCheck={mono ? false : undefined}
      autoComplete="off"
      className={cn(
        controlClassName,
        "h-9",
        mono && "font-mono",
        unit && "rounded-r-none",
        className,
      )}
      {...rest}
      aria-describedby={describedBy}
    />
  );
  if (!unit) return input;
  return (
    <div className="flex">
      {input}
      <span
        id={unitId}
        className="inline-flex h-9 shrink-0 items-center rounded-r-control border border-l-0 border-border bg-surface-subtle px-2.5 text-xs text-muted"
      >
        {unit}
      </span>
    </div>
  );
}
