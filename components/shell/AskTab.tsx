"use client";

import { Icon } from "@/components/ui/Icon";
import { useScreen } from "./screenState";

/** Edge tab that opens the "Ask about this result" drawer. */
export function AskTab() {
  const { state, dispatch } = useScreen();
  if (state.drawer === "ask") return null;

  return (
    <button
      type="button"
      aria-expanded={false}
      onClick={() => dispatch({ type: "openDrawer", drawer: "ask" })}
      className="fixed top-[calc(var(--topbar-h)+150px)] right-0 z-20 flex items-center gap-2 rounded-l-card border border-r-0 border-border bg-surface px-2 py-3 text-[13px] font-semibold shadow-sm hover:bg-surface-subtle [writing-mode:vertical-rl]"
    >
      <Icon name="message" className="size-4 rotate-90" />
      Ask about this result
    </button>
  );
}
