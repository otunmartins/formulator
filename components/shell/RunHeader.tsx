"use client";

import { formatContextLine } from "@/lib/utils/format";
import { useScreen, type LoadedHeader } from "./screenState";

interface HeaderText {
  eyebrow: string;
  title: string;
  context: string | null;
}

function headerText(header: LoadedHeader, mode: "single" | "batch"): HeaderText {
  const modeLabel = mode === "single" ? "Single screen" : "Batch screen";
  switch (header.kind) {
    case "empty":
      return {
        eyebrow: modeLabel,
        title: mode === "single" ? "New screen" : "New batch",
        context: null,
      };
    case "example":
      return {
        eyebrow: modeLabel,
        title: header.example.title,
        context: formatContextLine(header.example.input.context),
      };
    case "run": {
      const { run } = header;
      const context = run.context
        ? formatContextLine(run.context)
        : [run.route, "[PLACEHOLDER]"].filter(Boolean).join(" · ");
      return { eyebrow: `${modeLabel} · ${run.runId}`, title: run.title, context };
    }
    default: {
      const unreachable: never = header;
      return unreachable;
    }
  }
}

export function RunHeader() {
  const { state } = useScreen();
  const { eyebrow, title, context } = headerText(state.header, state.mode);

  return (
    <div className="mb-5" aria-busy={state.headerLoading}>
      <p className="font-mono text-[11px] font-medium tracking-widest text-muted uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-1.5 text-[22px] leading-tight font-semibold">{title}</h1>
      {state.headerLoading ? (
        <p role="status" className="mt-1 text-[13px] text-muted">
          Loading…
        </p>
      ) : (
        context && <p className="mt-1 text-[13px] text-muted">{context}</p>
      )}
    </div>
  );
}
