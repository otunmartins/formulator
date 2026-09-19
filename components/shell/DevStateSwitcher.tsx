"use client";

import { useScreen, type DevState } from "./screenState";

const STATES: readonly { id: DevState; label: string }[] = [
  { id: "S01", label: "New screen (empty)" },
  { id: "C01", label: "Recent runs dropdown" },
  { id: "C02", label: "User and workspace menu" },
  { id: "C03", label: "Input panel collapsed" },
];

/**
 * Dev-only jump to each reference screen for review. Not rendered in production builds.
 * Later builds add their states here (S02–S15, B01–B04).
 */
export function DevStateSwitcher() {
  const { dispatch } = useScreen();
  if (process.env.NODE_ENV === "production") return null;

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
          onClick={() => dispatch({ type: "devState", state: s.id })}
          className="rounded px-1.5 py-0.5 font-mono hover:bg-bg"
        >
          {s.id}
        </button>
      ))}
    </nav>
  );
}
