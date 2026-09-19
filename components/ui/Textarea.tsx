import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { controlClassName } from "./controlStyles";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Monospace, for sequences. */
  mono?: boolean;
}

export function Textarea({ mono, className, rows = 6, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      spellCheck={mono ? false : undefined}
      className={cn(
        controlClassName,
        "py-2 leading-relaxed",
        mono && "font-mono text-xs",
        className,
      )}
      {...rest}
    />
  );
}
