"use client";

import { useTransition } from "react";
import { lookupStructure } from "@/app/actions/inputs";
import { Field, FieldError } from "@/components/ui/Field";
import { FileDrop } from "@/components/ui/FileDrop";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { TextInput } from "@/components/ui/TextInput";
import { cn } from "@/lib/utils/cn";
import { MAX_FASTA_CHARS, structureFormat, type ProteinSource } from "@/lib/types/runInput";
import { useRunInput } from "./RunInputProvider";

const TABS = [
  { id: "pdb", label: "PDB ID" },
  { id: "uniprot", label: "UniProt ID" },
  { id: "sequence", label: "Sequence" },
  { id: "upload", label: "Upload" },
] as const satisfies readonly { id: ProteinSource; label: string }[];

const PREDICTED_NOTE =
  "The structure will be predicted, so liability sites are graded C (in-domain prediction).";

/** Protein source tabs. Only the active tab is sent with the run. */
export function ProteinSection() {
  const { draft, update } = useRunInput();

  return (
    <section aria-labelledby="protein-heading" className="space-y-3">
      <h3 id="protein-heading" className="text-[13px] font-semibold">
        Protein
      </h3>
      <Tabs
        label="Protein source"
        tabs={TABS}
        value={draft.proteinTab}
        onChange={(proteinTab) => update({ proteinTab })}
      >
        {draft.proteinTab === "pdb" && <PdbTab />}
        {draft.proteinTab === "uniprot" && <UniprotTab />}
        {draft.proteinTab === "sequence" && <SequenceTab />}
        {draft.proteinTab === "upload" && <UploadTab />}
      </Tabs>
    </section>
  );
}

function PdbTab() {
  const { draft, update, errors } = useRunInput();
  const [looking, startLookup] = useTransition();

  function onBlur() {
    const pdbId = draft.pdbId.trim().toUpperCase();
    if (!/^[0-9][A-Z0-9]{3}$/.test(pdbId)) return;
    if (draft.pdbChains.length > 0 && pdbId === draft.pdbId) return;
    startLookup(async () => {
      const result = await lookupStructure({ pdbId });
      if (!result.ok) return;
      const structure = result.data;
      update({
        pdbId,
        pdbChains: structure?.chains.map(({ id, label }) => ({ id, label })) ?? [],
        excludedChains: structure?.chains.filter((c) => c.excludedByDefault).map((c) => c.id) ?? [],
      });
    });
  }

  function toggle(chainId: string) {
    const excluded = draft.excludedChains.includes(chainId);
    update({
      excludedChains: excluded
        ? draft.excludedChains.filter((id) => id !== chainId)
        : [...draft.excludedChains, chainId],
    });
  }

  const idLooksComplete = /^[0-9][A-Za-z0-9]{3}$/.test(draft.pdbId.trim());

  return (
    <div className="space-y-3">
      <Field label="PDB ID" error={errors.pdbId}>
        {(p) => (
          <TextInput
            {...p}
            mono
            data-field="pdbId"
            value={draft.pdbId}
            // A new ID invalidates the chain list from the previous one.
            onChange={(e) => update({ pdbId: e.target.value, pdbChains: [], excludedChains: [] })}
            onBlur={onBlur}
            maxLength={4}
            placeholder="e.g. 1N8Z"
          />
        )}
      </Field>
      <div>
        <p id="chains-label" className="mb-1.5 text-xs font-semibold">
          Chains
        </p>
        {looking ? (
          <p className="text-xs text-muted">Looking up chains…</p>
        ) : draft.pdbChains.length > 0 ? (
          <div role="group" aria-labelledby="chains-label" className="flex flex-wrap gap-1.5">
            {draft.pdbChains.map((chain, index) => {
              const excluded = draft.excludedChains.includes(chain.id);
              return (
                <button
                  key={chain.id}
                  type="button"
                  aria-pressed={!excluded}
                  data-field={index === 0 ? "pdbChains" : undefined}
                  onClick={() => toggle(chain.id)}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-chip border px-2.5 text-xs font-medium",
                    excluded
                      ? "border-dashed border-border-strong text-muted"
                      : "border-border-strong bg-surface-subtle text-text",
                  )}
                >
                  <span className="font-mono">{chain.id}</span>
                  {chain.label}
                  {excluded && ", excluded"}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted">
            {idLooksComplete
              ? "Chain list not available for this ID. All chains will be used."
              : "Enter a PDB ID to list its chains."}
          </p>
        )}
        {errors.pdbChains && <FieldError>{errors.pdbChains}</FieldError>}
        {draft.pdbChains.length > 0 && (
          <p className="mt-1.5 text-xs text-muted">Select a chain to include or exclude it.</p>
        )}
      </div>
    </div>
  );
}

function UniprotTab() {
  const { draft, update, errors } = useRunInput();
  return (
    <Field label="UniProt ID" error={errors.uniprotId} hint={PREDICTED_NOTE}>
      {(p) => (
        <TextInput
          {...p}
          mono
          data-field="uniprotId"
          value={draft.uniprotId}
          onChange={(e) => update({ uniprotId: e.target.value })}
          maxLength={10}
          placeholder="e.g. P04626"
        />
      )}
    </Field>
  );
}

function SequenceTab() {
  const { draft, update, errors } = useRunInput();
  return (
    <Field
      label="Sequence (FASTA, one chain per record)"
      error={errors.fasta}
      hint={PREDICTED_NOTE}
    >
      {(p) => (
        <Textarea
          {...p}
          mono
          rows={7}
          data-field="fasta"
          value={draft.fasta}
          onChange={(e) => update({ fasta: e.target.value })}
          maxLength={MAX_FASTA_CHARS}
          placeholder={">chain_name\nSEQUENCE"}
        />
      )}
    </Field>
  );
}

function UploadTab() {
  const { draft, update, errors } = useRunInput();
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold">Structure file</p>
      <FileDrop
        id="structure-file"
        accept=".pdb,.ent,.cif,.mmcif"
        description="PDB or mmCIF, up to 20 MB. Only the file name is used for now."
        fileName={draft.upload?.fileName ?? null}
        onFile={(file) =>
          update({
            upload: {
              fileName: file.name,
              format: structureFormat(file.name),
              sizeBytes: file.size,
            },
          })
        }
        aria-invalid={Boolean(errors.upload)}
        aria-describedby={errors.upload ? "structure-file-error" : undefined}
        data-field="upload"
      />
      {errors.upload && <FieldError id="structure-file-error">{errors.upload}</FieldError>}
    </div>
  );
}
