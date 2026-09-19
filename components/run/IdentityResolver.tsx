"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { resolveIdentity } from "@/app/actions/runs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, FieldError } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TextInput } from "@/components/ui/TextInput";
import { useScreen } from "@/components/shell/screenState";
import type { IdentityCandidate } from "@/lib/types/runEvents";
import { overrideFormat } from "@/lib/utils/identifiers";

export interface IdentityResolverProps {
  runId: string;
  /** The excipient as entered. */
  query: string;
  /** Closest registry records; may be empty, leaving only the override. */
  candidates: IdentityCandidate[];
}

const OVERRIDE_FORMAT_ERROR = "Enter a CAS number (e.g. 9005-65-6) or a SMILES string.";

/**
 * S05: the identity step found no confident match, so the run is paused (not failed). The user
 * picks a candidate or enters a CAS/SMILES override; "Use and continue" resumes at Precedent.
 */
export function IdentityResolver({ runId, query, candidates }: IdentityResolverProps) {
  const { dispatch } = useScreen();
  const headingId = useId();
  const [candidateId, setCandidateId] = useState<string | null>(candidates[0]?.id ?? null);
  const [override, setOverride] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // A typed override wins over a picked candidate, so it's clear which one will be used.
  const usingOverride = override.trim() !== "";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    let choice;
    if (usingOverride) {
      if (!overrideFormat(override)) {
        setError(OVERRIDE_FORMAT_ERROR);
        return;
      }
      choice = { kind: "override" as const, value: override.trim() };
    } else if (candidateId) {
      choice = { kind: "candidate" as const, candidateId };
    } else {
      setError("Choose a candidate or enter an override.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resolveIdentity({ runId, choice });
      if (result.ok) dispatch({ type: "runResumed", events: result.data });
      else setError(result.error.message);
    });
  }

  return (
    <Card aria-labelledby={headingId} className="animate-reveal overflow-hidden border-gap-border">
      <div className="flex items-baseline gap-3 border-b border-gap-border bg-gap-fill px-6 py-3">
        <h2 id={headingId} className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="triangle-alert" className="size-4 self-center text-gap-text" />
          Identity unresolved
        </h2>
        <p className="text-[13px] text-muted">
          The screen is paused until the excipient is identified.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="space-y-5 px-6 py-5">
        <p className="text-[13px]">
          <span className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs">{query}</span> did not
          match PubChem, ChEBI or the excipient registry.{" "}
          {candidates.length > 0
            ? "Choose a candidate or enter an override."
            : "Enter an override."}
        </p>

        {candidates.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-xs font-semibold">Closest candidates</legend>
            <div className="space-y-2">
              {candidates.map((c) => {
                const checked = !usingOverride && candidateId === c.id;
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-control border border-border px-4 py-3 text-[13px] has-[:checked]:border-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
                  >
                    <input
                      type="radio"
                      name={`${headingId}-candidate`}
                      value={c.id}
                      checked={checked}
                      onChange={() => {
                        setCandidateId(c.id);
                        setOverride("");
                        setError(null);
                      }}
                      className="size-4 accent-accent"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold">{c.name}</span>{" "}
                      <span className="font-mono text-xs text-muted">CAS {c.cas}</span>
                    </span>
                    <span className="text-xs text-muted">{c.basis}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex items-start gap-3">
          <Field
            label="Manual override (CAS or SMILES)"
            hint="Overrides are recorded in the run manifest with your name."
            className="max-w-md flex-1"
          >
            {(control) => (
              <TextInput
                {...control}
                mono
                value={override}
                placeholder="e.g. 9005-65-6"
                maxLength={500}
                onChange={(e) => {
                  setOverride(e.target.value);
                  setError(null);
                }}
              />
            )}
          </Field>
          <Button type="submit" variant="primary" className="mt-[22px]" disabled={pending}>
            {pending ? "Continuing…" : "Use and continue"}
          </Button>
        </div>
        <div role="alert">{error && <FieldError>{error}</FieldError>}</div>
      </form>
    </Card>
  );
}
