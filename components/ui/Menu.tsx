"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

const MenuContext = createContext<{ close: (restoreFocus: boolean) => void } | null>(null);

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

export interface MenuProps {
  /** Accessible name of the menu. */
  label: string;
  /** Visible content of the trigger button. */
  trigger: ReactNode;
  /** Accessible name of the trigger, when its visible content isn't enough. */
  triggerLabel?: string;
  triggerClassName?: string;
  align?: "start" | "end";
  menuClassName?: string;
  /** Controlled open state (used by the dev state switcher). Omit for uncontrolled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Menu button (WAI-ARIA menu pattern): opens on click, Enter, Space or ArrowDown; arrow keys,
 * Home and End move between items; Esc closes and returns focus to the trigger; Tab or a
 * click outside closes.
 */
export function Menu({
  label,
  trigger,
  triggerLabel,
  triggerClassName,
  align = "start",
  menuClassName,
  open: controlledOpen,
  onOpenChange,
  children,
}: MenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function setOpen(next: boolean) {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  function close(restoreFocus: boolean) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);

  // On open, focus the checked item if there is one, otherwise the first.
  useEffect(() => {
    if (!open) return;
    const all = items();
    const checked = all.find((el) => el.getAttribute("aria-checked") === "true");
    (checked ?? all[0])?.focus();
  }, [open]);

  // Close on a pointer press outside the menu and its trigger.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        if (controlledOpen === undefined) setUncontrolledOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, controlledOpen, onOpenChange]);

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const all = items();
    const index = all.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    switch (event.key) {
      case "ArrowDown":
        next = all[(index + 1) % all.length];
        break;
      case "ArrowUp":
        next = all[(index - 1 + all.length) % all.length];
        break;
      case "Home":
        next = all[0];
        break;
      case "End":
        next = all[all.length - 1];
        break;
      case "Escape":
        event.preventDefault();
        close(true);
        return;
      case "Tab":
        close(false);
        return;
      default:
        return;
    }
    event.preventDefault();
    next?.focus();
  }

  return (
    <MenuContext.Provider value={{ close }}>
      <div ref={rootRef} className="relative">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-label={triggerLabel}
          onClick={() => setOpen(!open)}
          onKeyDown={onTriggerKeyDown}
          className={triggerClassName}
        >
          {trigger}
        </button>
        {open && (
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onMenuKeyDown}
            className={cn(
              "absolute top-full z-40 mt-2 min-w-56 rounded-card border border-border bg-surface py-2 shadow-lg",
              align === "end" ? "right-0" : "left-0",
              menuClassName,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

export interface MenuItemProps {
  onSelect: () => void;
  /** Makes this a radio item (e.g. the active workspace), shown with a check mark. */
  checked?: boolean;
  children: ReactNode;
  className?: string;
}

export function MenuItem({ onSelect, checked, children, className }: MenuItemProps) {
  const ctx = useContext(MenuContext);
  const isRadio = checked !== undefined;
  return (
    <button
      type="button"
      role={isRadio ? "menuitemradio" : "menuitem"}
      aria-checked={isRadio ? checked : undefined}
      tabIndex={-1}
      onClick={() => {
        ctx?.close(true);
        onSelect();
      }}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 text-left text-[13px] text-text hover:bg-surface-subtle focus-visible:bg-accent-soft focus-visible:-outline-offset-2",
        className,
      )}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {checked && <Icon name="check" className="size-4 text-text" />}
    </button>
  );
}

export interface MenuGroupProps {
  label: string;
  children: ReactNode;
}

/** A labelled group of items with a small uppercase heading. */
export function MenuGroup({ label, children }: MenuGroupProps) {
  return (
    <div role="group" aria-label={label}>
      <div
        aria-hidden="true"
        className="px-4 pt-1 pb-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase"
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="mx-2 my-2 border-t border-border" />;
}
