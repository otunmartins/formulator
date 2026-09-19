"use client";

import { useRef, useState } from "react";
import { ContextSection } from "@/components/inputs/ContextSection";
import { ExcipientSection } from "@/components/inputs/ExcipientSection";
import { ProteinSection } from "@/components/inputs/ProteinSection";
import { useRunInput } from "@/components/inputs/RunInputProvider";
import { useStartRun } from "@/components/run/useStartRun";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { NOT_CONNECTED, useNotice } from "@/components/ui/Notice";
import { FIELD_ORDER, requestFromDraft, type FieldErrors } from "@/lib/types/runInput";
import { useScreen } from "./screenState";

const PANEL_ID = "input-panel";

export interface InputPanelProps {
  /** Locks every input and the Run button, e.g. for a signed version. TODO(build-07). */
  disabled?: boolean;
}

/**
 * Left input panel (sticky, collapsible). Single mode: Excipient, Protein and Context, and
 * Run, which validates and calls `startRun`. The draft lives in RunInputProvider, so it
 * survives collapsing the panel.
 * TODO(build-09): CSV upload and preview in Batch mode.
 * TODO(build-03): at tablet widths, collapse after a run completes.
 */
export function InputPanel({ disabled = false }: InputPanelProps) {
  const { state, dispatch } = useScreen();
  const { draft, errors, setErrors } = useRunInput();
  const notify = useNotice();
  const formRef = useRef<HTMLFieldSetElement>(null);
  const { start, pending } = useStartRun();
  const [attempted, setAttempted] = useState(false);

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

  function focusFirstError(found: FieldErrors) {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (!first) return;
    // After the errors render, so the field's description includes its error.
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
    });
  }

  function onRun() {
    if (state.mode === "batch") {
      notify(NOT_CONNECTED); // TODO(build-09): batch runs.
      return;
    }
    setAttempted(true);
    const result = requestFromDraft(draft);
    if (!result.ok) {
      setErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }
    setErrors({});
    start(result.request);
  }

  const errorCount = Object.keys(errors).length;

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
      <fieldset
        ref={formRef}
        disabled={disabled || pending}
        aria-label="Screen inputs"
        className="min-h-0 flex-1 overflow-y-auto px-6 pb-4"
      >
        {state.mode === "single" ? (
          <div className="space-y-6 py-3">
            <ExcipientSection />
            <ProteinSection />
            <ContextSection />
          </div>
        ) : (
          <section className="py-5">
            <h3 className="text-[13px] font-semibold">Batch input</h3>
            <p className="mt-2 text-[13px] text-muted">{NOT_CONNECTED}.</p>
          </section>
        )}
      </fieldset>
      <div className="border-t border-border px-6 pt-4 pb-5">
        <Button variant="primary" size="lg" onClick={onRun} disabled={disabled || pending}>
          <Icon name="play" className="size-3" />
          {pending ? "Starting…" : state.mode === "single" ? "Run screen" : "Run batch"}
        </Button>
        <div role="alert">
          {attempted && errorCount > 0 && (
            <FieldError>
              {errorCount === 1
                ? "Check the highlighted field."
                : `Check the ${errorCount} highlighted fields.`}
            </FieldError>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted">
          Uses the database snapshots listed in the run manifest.
        </p>
      </div>
    </aside>
  );
}
