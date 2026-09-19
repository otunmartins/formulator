"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { IdentityHint, StructureInfo } from "@/lib/types/lookups";
import {
  draftFromRequest,
  emptyDraft,
  type ChainOption,
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

/** Errors that belong to fields a switch or tab hides; they're cleared when it changes. */
const PROTEIN_ERRORS: readonly FieldKey[] = ["pdbId", "pdbChains", "uniprotId", "fasta", "upload"];
const POLYMER_ERRORS: readonly FieldKey[] = ["repeatUnit", "endGroups", "dp", "residualMonomers"];

type Patch = Partial<RunInputDraft>;
type PatchOrFn = Patch | ((current: RunInputDraft) => Patch);

interface FormState {
  draft: RunInputDraft;
  errors: FieldErrors;
}

type FormAction =
  | { type: "update"; patch: PatchOrFn }
  | { type: "setErrors"; errors: FieldErrors }
  | { type: "load"; request: RunRequest; chains: ChainOption[] };

/** Applies a patch and clears the errors of the fields it touches (pure, so testable). */
export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "update": {
      const patch = typeof action.patch === "function" ? action.patch(state.draft) : action.patch;
      const keys = Object.keys(patch) as (keyof RunInputDraft)[];
      if (keys.length === 0) return state;
      const errors = { ...state.errors };
      for (const key of keys) {
        const field = ERROR_FOR[key];
        if (field) delete errors[field];
      }
      // A hidden field's error would still count in "Check the N highlighted fields".
      if (keys.includes("proteinTab")) PROTEIN_ERRORS.forEach((k) => delete errors[k]);
      if (keys.includes("polymerOn")) POLYMER_ERRORS.forEach((k) => delete errors[k]);
      return { draft: { ...state.draft, ...patch }, errors };
    }
    case "setErrors":
      return { ...state, errors: action.errors };
    case "load":
      return { draft: draftFromRequest(action.request, action.chains), errors: {} };
    default: {
      const unreachable: never = action;
      return unreachable;
    }
  }
}

interface RunInputContextValue {
  draft: RunInputDraft;
  /**
   * Updates fields and clears their inline errors. Pass a function to patch from the latest
   * draft, e.g. to apply an async result only if the field hasn't changed since.
   */
  update: (patch: PatchOrFn) => void;
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
  const [{ draft, errors }, dispatch] = useReducer(formReducer, { draft: emptyDraft, errors: {} });
  const [identity, setIdentity] = useState<RunInputContextValue["identity"]>(null);

  const update = useCallback((patch: PatchOrFn) => dispatch({ type: "update", patch }), []);
  const setErrors = useCallback(
    (next: FieldErrors) => dispatch({ type: "setErrors", errors: next }),
    [],
  );
  const load = useCallback<RunInputContextValue["load"]>((request, structure, hint) => {
    const chains = structure?.chains.map(({ id, label }) => ({ id, label })) ?? [];
    dispatch({ type: "load", request, chains });
    setIdentity({ query: request.excipient.query, hint });
  }, []);

  const value = useMemo(
    () => ({ draft, update, errors, setErrors, identity, setIdentity, load }),
    [draft, update, errors, setErrors, identity, load],
  );
  return <RunInputContext.Provider value={value}>{children}</RunInputContext.Provider>;
}

export function useRunInput() {
  const ctx = useContext(RunInputContext);
  if (!ctx) throw new Error("useRunInput must be used inside <RunInputProvider>");
  return ctx;
}
