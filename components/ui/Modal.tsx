"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { IconButton } from "./IconButton";
import { useFocusTrap } from "./useFocusTrap";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Centred modal dialog: traps focus, closes on Esc or the close button, restores focus. */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  if (!open) return null;
  return (
    <ModalBody onClose={onClose} title={title} footer={footer} className={className}>
      {children}
    </ModalBody>
  );
}

function ModalBody({ onClose, title, children, footer, className }: Omit<ModalProps, "open">) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40 p-4">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[85vh] w-full max-w-lg flex-col rounded-card border border-border bg-surface shadow-xl",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
