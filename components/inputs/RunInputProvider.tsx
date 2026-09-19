"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
import {
  draftFromRequest,
  emptyDraft,
  type FieldErrors,
  type FieldKey,
  type RunInputDraft,
  type RunRequest,
} from "@/lib/types/runInput";

/** Maps draft properties to the error they clear when edited. */
const ERROR_FOR: Partial<Record<keyof RunInputDraft, FieldKey>> = {
  query: "query",
  repeatUnit: "repeatUnit",
  endGroups: "endGroups",
  dp: "dp",
  residualMonomers: "residualMonomers",
  pdbId: "pdbId",
  excludedChains: "pdbChains",
  uniprotId: "uniprotId",
  fasta: "fasta",
  upload: "upload",
  doseValue: "dose",
  conc: "conc",
};

interface RunInputContextValue {
  draft: RunInputDraft;
  /** Updates fields and clears their inline errors. */
  update: (patch: Partial<RunInputDraft>) => void;
  errors: FieldErrors;
  setErrors: (errors: FieldErrors) => void;
  /** The identity hint and the query it was looked up for. */
  identity: { query: string; hint: IdentityHint } | null;
  setIdentity: (identity: { query: string; hint: IdentityHint } | null) => void;
  /** Fills the whole panel, e.g. from "Load example". */
  load: (request: RunRequest, structure: StructureInfo | null, identity: IdentityHint) => void;
}

const RunInputContext = createContext<RunInputContextValue | null>(null);

/** Holds the input panel's draft so the panel and "Load example" share it. */
export function RunInputProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RunInputDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [identity, setIdentity] = useState<RunInputContextValue["identity"]>(null);

  const update = useCallback((patch: Partial<RunInputDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors((e) => {
      const cleared = { ...e };
      for (const key of Object.keys(patch) as (keyof RunInputDraft)[]) {
        const field = ERROR_FOR[key];
        if (field) delete cleared[field];
      }
      return cleared;
    });
  }, []);

  const load = useCallback<RunInputContextValue["load"]>((request, structure, hint) => {
    const chains = structure?.chains.map(({ id, label }) => ({ id, label })) ?? [];
    setDraft(draftFromRequest(request, chains));
    setErrors({});
    setIdentity({ query: request.excipient.query, hint });
  }, []);

  const value = useMemo(
    () => ({ draft, update, errors, setErrors, identity, setIdentity, load }),
    [draft, update, errors, identity, load],
  );
  return <RunInputContext.Provider value={value}>{children}</RunInputContext.Provider>;
}

export function useRunInput() {
  const ctx = useContext(RunInputContext);
  if (!ctx) throw new Error("useRunInput must be used inside <RunInputProvider>");
  return ctx;
}
