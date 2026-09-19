"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";
import { useFocusTrap } from "./useFocusTrap";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/** Right-hand drawer between the top bar and footer: traps focus, closes on Esc, restores focus. */
export function Drawer({ open, onClose, title, children, className }: DrawerProps) {
  if (!open) return null;
  return (
    <DrawerBody onClose={onClose} title={title} className={className}>
      {children}
    </DrawerBody>
  );
}

function DrawerBody({ onClose, title, children, className }: Omit<DrawerProps, "open">) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cn(
        "fixed top-topbar right-0 bottom-footer z-40 flex w-[420px] max-w-full flex-col border-l border-border bg-surface shadow-xl",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 id={titleId} className="text-[15px] font-semibold">
          {title}
        </h2>
        <IconButton icon="x" label="Close" onClick={onClose} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </div>
  );
}
