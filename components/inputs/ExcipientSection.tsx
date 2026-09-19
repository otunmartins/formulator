"use client";

import { useTransition } from "react";
import { lookupIdentity } from "@/app/actions/inputs";
import { Field } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { TextInput } from "@/components/ui/TextInput";
import type { IdentityHint } from "@/lib/types/lookups";
import { useRunInput } from "./RunInputProvider";

const POLYMER_ID = "polymer-fields";

function hintText(hint: IdentityHint): string {
  switch (hint.status) {
    case "resolved":
      return `Resolved: ${hint.name} · CAS ${hint.cas}`;
    case "user_smiles":
      return `${hint.name}: no registry match · user SMILES ${hint.smiles}`;
    case "no_match":
      return "No registry match. Identity is checked when the run starts.";
    default: {
      const unreachable: never = hint;
      return unreachable;
    }
  }
}

/** Excipient (name, CAS or SMILES) with its identity hint, and the Polymer fields. */
export function ExcipientSection() {
  const { draft, update, errors, identity, setIdentity } = useRunInput();
  const [looking, startLookup] = useTransition();

  // A hint only applies to the text it was looked up for.
  const hint = identity && identity.query === draft.query.trim() ? identity.hint : null;

  function onBlur() {
    const query = draft.query.trim();
    if (!query || identity?.query === query) return;
    startLookup(async () => {
      const result = await lookupIdentity({ query });
      if (result.ok) setIdentity({ query, hint: result.data });
    });
  }

  return (
    <section aria-labelledby="excipient-heading" className="space-y-4">
      <h3 id="excipient-heading" className="text-[13px] font-semibold">
        Excipient
      </h3>
      <Field
        label="Name, CAS or SMILES"
        error={errors.query}
        hint={looking ? "Looking up identity…" : hint ? hintText(hint) : undefined}
      >
        {(p) => (
          <TextInput
            {...p}
            mono
            data-field="query"
            value={draft.query}
            onChange={(e) => update({ query: e.target.value })}
            onBlur={onBlur}
            maxLength={2000}
          />
        )}
      </Field>
      <Switch
        label="Polymer"
        checked={draft.polymerOn}
        onChange={(polymerOn) => update({ polymerOn })}
        controls={POLYMER_ID}
      />
      {draft.polymerOn && (
        <div
          id={POLYMER_ID}
          className="space-y-3 rounded-card border border-dashed border-border-strong bg-surface-subtle p-3"
        >
          <Field label="Repeat unit" error={errors.repeatUnit}>
            {(p) => (
              <TextInput
                {...p}
                mono
                data-field="repeatUnit"
                value={draft.repeatUnit}
                onChange={(e) => update({ repeatUnit: e.target.value })}
                maxLength={200}
              />
            )}
          </Field>
          <Field label="End groups" error={errors.endGroups}>
            {(p) => (
              <TextInput
                {...p}
                data-field="endGroups"
                value={draft.endGroups}
                onChange={(e) => update({ endGroups: e.target.value })}
                maxLength={200}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Approx. DP" error={errors.dp}>
              {(p) => (
                <TextInput
                  {...p}
                  mono
                  data-field="dp"
                  value={draft.dp}
                  onChange={(e) => update({ dp: e.target.value })}
                  maxLength={50}
                />
              )}
            </Field>
            <Field
              label="Residual monomers"
              error={errors.residualMonomers}
              hint="Separate with commas"
            >
              {(p) => (
                <TextInput
                  {...p}
                  data-field="residualMonomers"
                  value={draft.residualMonomers}
                  onChange={(e) => update({ residualMonomers: e.target.value })}
                />
              )}
            </Field>
          </div>
        </div>
      )}
    </section>
  );
}
