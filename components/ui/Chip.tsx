import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

export type ChipTone = "neutral" | "signed" | "custom";

export interface ChipProps {
  children: ReactNode;
  icon?: IconName;
  tone?: ChipTone;
  /** Mono text for IDs and versions. */
  mono?: boolean;
  /** "sm" for dense summaries such as the verdict counts in a card header. */
  size?: "md" | "sm";
  className?: string;
}

const TONES: Record<ChipTone, string> = {
  neutral: "border-border-strong bg-surface-subtle text-text",
  signed: "border-prec-text bg-prec-text text-on-accent",
  custom: "",
};

/** Small status label. Always carries text; the icon is decorative. */
export function Chip({
  children,
  icon,
  tone = "neutral",
  mono,
  size = "md",
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-chip border font-medium whitespace-nowrap",
        size === "md" ? "h-6 px-2.5 text-xs" : "h-5 px-2 text-[11px]",
        mono && "font-mono",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} className={size === "md" ? "size-3.5" : "size-3"} />}
      {children}
    </span>
  );
}
