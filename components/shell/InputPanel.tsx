"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NOT_CONNECTED, useNotice } from "@/components/ui/Notice";
import { useScreen } from "./screenState";

const PANEL_ID = "input-panel";

/**
 * Left input panel (sticky, collapsible). Build 01 has the container, section headings
 * and the Run button only. TODO(build-02): excipient, protein and context fields.
 * TODO(build-09): CSV upload and preview in Batch mode.
 * TODO(build-03): at tablet widths, collapse after a run completes.
 */
export function InputPanel() {
  const { state, dispatch } = useScreen();
  const notify = useNotice();

  if (state.panelCollapsed) {
    return (
      <aside
        aria-label="Input"
        className="sticky top-topbar flex h-[calc(100vh-var(--topbar-h)-var(--footer-h))] w-rail shrink-0 flex-col items-center gap-4 border-r border-border bg-surface py-4"
      >
        <IconButton
          icon="panel-open"
          label="Expand input panel"
          aria-expanded={false}
          aria-controls={PANEL_ID}
          onClick={() => dispatch({ type: "setPanelCollapsed", collapsed: false })}
        />
        <span
          aria-hidden="true"
          className="font-mono text-[11px] font-medium tracking-widest text-muted uppercase [writing-mode:vertical-rl]"
        >
          Input
        </span>
      </aside>
    );
  }

  const sections = state.mode === "single" ? ["Excipient", "Protein", "Context"] : ["Batch input"];

  return (
    <aside
      id={PANEL_ID}
      aria-label="Input"
      className="sticky top-topbar flex h-[calc(100vh-var(--topbar-h)-var(--footer-h))] w-panel-tablet shrink-0 flex-col border-r border-border bg-surface desk:w-panel"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <h2 className="font-mono text-[11px] font-medium tracking-widest text-muted uppercase">
          Input
        </h2>
        <IconButton
          icon="panel-close"
          label="Collapse input panel"
          aria-expanded={true}
          aria-controls={PANEL_ID}
          onClick={() => dispatch({ type: "setPanelCollapsed", collapsed: true })}
        />
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {sections.map((title) => (
          <section key={title} className="border-b border-border py-5 last:border-b-0">
            <h3 className="text-[13px] font-semibold">{title}</h3>
            {state.mode === "batch" && (
              <p className="mt-2 text-[13px] text-muted">{NOT_CONNECTED}.</p>
            )}
          </section>
        ))}
      </div>
      <div className="border-t border-border px-6 pt-4 pb-5">
        {/* TODO(build-03): start the run through the startRun action. */}
        <Button variant="primary" size="lg" onClick={() => notify(NOT_CONNECTED)}>
          <Icon name="play" className="size-3" />
          {state.mode === "single" ? "Run screen" : "Run batch"}
        </Button>
        <p className="mt-2 text-center text-[11px] text-muted">
          Uses the database snapshots listed in the run manifest.
        </p>
      </div>
    </aside>
  );
}
