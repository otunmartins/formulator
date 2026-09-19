"use client";

import { Card } from "@/components/ui/Card";
import { VerdictChip } from "@/components/ui/VerdictChip";
import { verdictSchema } from "@/lib/types/domain";
import type { Dossier } from "@/lib/types/dossier";
import { verdictCounts } from "@/lib/utils/dossier";
import { VerdictRow } from "./VerdictRow";

export interface VerdictMatrixProps {
  dossier: Dossier;
  /** Header line; defaults to "No overall score · each endpoint stands alone". */
  note?: string;
  expandedIds: ReadonlySet<string>;
  onToggle: (endpointId: string) => void;
}

const DEFAULT_NOTE = "No overall score · each endpoint stands alone";

/**
 * S07: one row per endpoint with its verdict, grade and basis. The header counts each verdict
 * on its own; nothing is summed.
 */
export function VerdictMatrix({
  dossier,
  note = DEFAULT_NOTE,
  expandedIds,
  onToggle,
}: VerdictMatrixProps) {
  const counts = verdictCounts(dossier.endpoints);

  return (
    // No overflow-hidden: it clipped the grade legend on the last rows. The bottom padding keeps
    // an expanded last row's fill inside the card's rounded corners instead.
    <Card aria-labelledby="verdict-matrix-title" className="animate-reveal pb-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-6 py-4">
        <h2 id="verdict-matrix-title" className="text-[15px] font-semibold">
          Verdict matrix
        </h2>
        <p className="text-[13px] text-muted">{note}</p>
        <ul aria-label="Endpoints per verdict" className="ml-auto flex flex-wrap gap-1.5">
          {verdictSchema.options.map((verdict) => (
            <li key={verdict}>
              <VerdictChip verdict={verdict} count={counts[verdict]} size="sm" />
            </li>
          ))}
        </ul>
      </div>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Endpoints with verdict, evidence grade and basis</caption>
        <colgroup>
          <col className="w-11" />
          <col className="w-[23%]" />
          {/* Fixed so the longest label, "Supported without precedent", never meets the grade. */}
          <col className="w-56" />
          <col className="w-16" />
          <col />
        </colgroup>
        <thead className="border-t border-border bg-surface-subtle">
          <tr className="font-mono text-[11px] tracking-widest text-muted uppercase">
            <th scope="col" className="py-2.5 font-medium">
              <span className="sr-only">Sources</span>
            </th>
            <th scope="col" className="py-2.5 pr-4 text-left font-medium">
              Endpoint
            </th>
            <th scope="col" className="py-2.5 pr-4 text-left font-medium">
              Verdict
            </th>
            <th scope="col" className="py-2.5 pr-4 text-left font-medium">
              Grade
            </th>
            <th scope="col" className="py-2.5 pr-6 text-left font-medium">
              Basis
            </th>
          </tr>
        </thead>
        {dossier.endpoints.map((endpoint) => (
          <VerdictRow
            key={endpoint.id}
            endpoint={endpoint}
            expanded={expandedIds.has(endpoint.id)}
            onToggle={() => onToggle(endpoint.id)}
          />
        ))}
        {!dossier.hasFixture && (
          <tbody className="border-t border-border">
            <tr>
              <td />
              <td colSpan={4} className="py-4 pr-6 text-[13px] text-muted">
                No endpoint fixture for this excipient [PLACEHOLDER]
              </td>
            </tr>
          </tbody>
        )}
      </table>
    </Card>
  );
}
