"use client";

import { Field } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { TextInput } from "@/components/ui/TextInput";
import type { DoseUnit, Frequency, Route, StorageTemp } from "@/lib/types/domain";
import { formatTemp } from "@/lib/utils/format";
import { useRunInput } from "./RunInputProvider";

const ROUTES = [
  { value: "SC", label: "SC" },
  { value: "IV", label: "IV" },
  { value: "IM", label: "IM" },
] as const satisfies readonly { value: Route; label: string }[];

const FREQUENCIES = [
  { value: "once", label: "Single dose" },
  { value: "qd", label: "Daily" },
  { value: "qw", label: "Weekly" },
  { value: "q2w", label: "Every 2 weeks" },
  { value: "q3w", label: "Every 3 weeks" },
  { value: "q4w", label: "Every 4 weeks" },
] as const satisfies readonly { value: Frequency; label: string }[];

const DOSE_UNITS = [
  { value: "mg", label: "mg" },
  { value: "mg/kg", label: "mg/kg" },
] as const satisfies readonly { value: DoseUnit; label: string }[];

const TEMPS: Record<`${StorageTemp}`, StorageTemp> = { "4": 4, "25": 25, "40": 40 };

const STORAGE = (["4", "25", "40"] as const).map((value) => ({
  value,
  label: formatTemp(TEMPS[value]),
}));

/** Product context: route, dose + unit, frequency, excipient concentration, storage. */
export function ContextSection() {
  const { draft, update, errors } = useRunInput();

  return (
    <section aria-labelledby="context-heading" className="space-y-4">
      <h3 id="context-heading" className="text-[13px] font-semibold">
        Context
      </h3>
      <div>
        <p className="mb-1.5 text-xs font-semibold">Route</p>
        <Segmented
          label="Route"
          options={ROUTES}
          value={draft.route}
          onChange={(route) => update({ route })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Protein dose" error={errors.dose}>
          {(p) => (
            <div className="flex">
              <TextInput
                {...p}
                mono
                inputMode="decimal"
                data-field="dose"
                value={draft.doseValue}
                onChange={(e) => update({ doseValue: e.target.value })}
                className="min-w-0 flex-1 rounded-r-none"
              />
              <Select
                aria-label="Dose unit"
                options={DOSE_UNITS}
                value={draft.doseUnit}
                onChange={(doseUnit) => update({ doseUnit })}
                className="w-[4.25rem] shrink-0 rounded-l-none border-l-0 bg-surface-subtle px-1.5 pr-5 text-xs"
              />
            </div>
          )}
        </Field>
        <Field label="Frequency">
          {(p) => (
            <Select
              id={p.id}
              options={FREQUENCIES}
              value={draft.frequency}
              onChange={(frequency) => update({ frequency })}
            />
          )}
        </Field>
      </div>
      <Field label="Excipient concentration" error={errors.conc}>
        {(p) => (
          <TextInput
            {...p}
            mono
            inputMode="decimal"
            unit="mg/mL"
            data-field="conc"
            value={draft.conc}
            onChange={(e) => update({ conc: e.target.value })}
          />
        )}
      </Field>
      <div>
        <p className="mb-1.5 text-xs font-semibold">Storage temperature</p>
        <Segmented
          label="Storage temperature"
          options={STORAGE}
          value={`${draft.storage}`}
          onChange={(value) => update({ storage: TEMPS[value] })}
        />
      </div>
    </section>
  );
}
