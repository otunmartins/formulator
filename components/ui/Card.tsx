import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "div" | "article";
}

export function Card({ as: Tag = "section", className, ...rest }: CardProps) {
  return (
    <Tag className={cn("rounded-card border border-border bg-surface", className)} {...rest} />
  );
}
