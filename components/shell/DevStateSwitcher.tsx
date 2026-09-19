"use client";

import { useTransition } from "react";
import { startDevRun } from "@/app/actions/dev";
import { useRunInput } from "@/components/inputs/RunInputProvider";
import { useNotice } from "@/components/ui/Notice";
import { useScreen, type DevState } from "./screenState";

const STATES: readonly { id: DevState; label: string }[] = [
  { id: "S01", label: "New screen (empty)" },
  { id: "C01", label: "Recent runs dropdown" },
  { id: "C02", label: "User and workspace menu" },
  { id: "C03", label: "Input panel collapsed" },
  { id: "S04", label: "Run in progress" },
  { id: "S05", label: "Identity unresolved" },
  { id: "S06", label: "Step error" },
];

/** States that need a run: the server starts a backdated mock run that lands on them. */
const RUN_STATES = new Set<DevState>(["S04", "S05", "S06"]);

/**
 * Dev-only jump to each reference screen for review. Not rendered in production builds.
 * Later builds add their states here (S02–S15, B01–B04).
 */
export function DevStateSwitcher() {
  const { dispatch } = useScreen();
  const runInput = useRunInput();
  const notify = useNotice();
  const [, startTransition] = useTransition();
  if (process.env.NODE_ENV === "production") return null;

  function jump(target: DevState) {
    dispatch({ type: "devState", state: target });
    if (!RUN_STATES.has(target)) return;
    dispatch({ type: "headerLoading", loading: true });
    startTransition(async () => {
      const result = await startDevRun({ state: target });
      if (result.ok) {
        const { run, input, structure, identity } = result.data;
        runInput.load(input, structure, identity);
        dispatch({ type: "loadRun", run });
      } else {
        dispatch({ type: "headerLoading", loading: false });
        notify(result.error.message, "error");
      }
    });
  }

  return (
    <nav
      aria-label="Dev state switcher"
      className="flex items-center gap-0.5 rounded-control border border-dashed border-border-strong p-0.5 text-[11px] opacity-60 transition-opacity focus-within:opacity-100 hover:opacity-100"
    >
      <span className="px-1 font-mono text-muted">DEV</span>
      {STATES.map((s) => (
        <button
          key={s.id}
          type="button"
          title={s.label}
          aria-label={`${s.id}: ${s.label}`}
          onClick={() => jump(s.id)}
          className="rounded px-1.5 py-0.5 font-mono hover:bg-bg"
        >
          {s.id}
        </button>
      ))}
    </nav>
  );
}
