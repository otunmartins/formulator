"use client";

import { Icon } from "@/components/ui/Icon";
import { useScreen } from "./screenState";

/**
 * Edge tab that opens the "Ask about this result" drawer. It stays mounted while the drawer
 * is open (the drawer covers it) so focus can return to it on close.
 */
export function AskTab() {
  const { state, dispatch } = useScreen();

  return (
    <button
      type="button"
      aria-expanded={state.drawer === "ask"}
      onClick={() => dispatch({ type: "openDrawer", drawer: "ask" })}
      className="fixed top-[calc(var(--topbar-h)+150px)] right-0 z-20 flex items-center gap-2 rounded-l-card border border-r-0 border-border bg-surface px-2 py-3 text-[13px] font-semibold shadow-sm hover:bg-surface-subtle [writing-mode:vertical-rl]"
    >
      <Icon name="message" className="size-4 rotate-90" />
      Ask about this result
    </button>
  );
}
