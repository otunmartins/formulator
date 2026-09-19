import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-hover disabled:hover:bg-accent disabled:opacity-45",
  secondary:
    "border border-border-strong bg-surface text-text hover:bg-surface-subtle disabled:border-border disabled:text-muted disabled:opacity-70 disabled:hover:bg-surface",
  ghost: "text-text hover:bg-bg disabled:text-muted disabled:hover:bg-transparent",
  link: "text-accent underline underline-offset-2 hover:text-accent-hover disabled:text-muted disabled:no-underline",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9 px-3.5 text-[13px]",
  lg: "h-10 w-full px-4 text-sm",
};

export function buttonClassName(variant: ButtonVariant = "secondary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed",
    VARIANTS[variant],
    variant === "link" ? "h-auto px-0 text-[13px]" : SIZES[size],
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return <button type={type} className={cn(buttonClassName(variant, size), className)} {...rest} />;
}
