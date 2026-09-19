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
  className?: string;
}

const TONES: Record<ChipTone, string> = {
  neutral: "border-border-strong bg-surface-subtle text-text",
  signed: "border-prec-text bg-prec-text text-on-accent",
  custom: "",
};

/** Small status label. Always carries text; the icon is decorative. */
export function Chip({ children, icon, tone = "neutral", mono, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-chip border px-2.5 text-xs font-medium whitespace-nowrap",
        mono && "font-mono",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} className="size-3.5" />}
      {children}
    </span>
  );
}
