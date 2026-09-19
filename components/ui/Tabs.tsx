"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

export interface TabsProps<T extends string> {
  /** Accessible name for the tab list. */
  label: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Content of the selected tab's panel. */
  children: ReactNode;
  className?: string;
}

/** Underlined tabs with roving focus (arrow keys, Home, End), per the WAI-ARIA tabs pattern. */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
  className,
}: TabsProps<T>) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const index = tabs.findIndex((t) => t.id === value);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    const tab = tabs[next];
    if (!tab) return;
    event.preventDefault();
    onChange(tab.id);
    listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="flex gap-0.5 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={onKeyDown}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-2.5 py-2 text-[13px] whitespace-nowrap transition-colors",
                selected
                  ? "border-accent font-medium text-text"
                  : "border-transparent text-muted hover:text-text",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${value}`}
        className="pt-4"
      >
        {children}
      </div>
    </div>
  );
}
