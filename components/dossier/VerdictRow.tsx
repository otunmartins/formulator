"use client";

import { GradeBadge } from "@/components/ui/GradeBadge";
import { Icon } from "@/components/ui/Icon";
import { VerdictChip } from "@/components/ui/VerdictChip";
import type { Endpoint } from "@/lib/types/dossier";
import { cn } from "@/lib/utils/cn";
import { OodWarning } from "./OodWarning";
import { SourceList } from "./SourceList";

export interface VerdictRowProps {
  endpoint: Endpoint;
  expanded: boolean;
  onToggle: () => void;
}

/** One endpoint: verdict (icon + text), evidence grade, basis, and its sources when expanded. */
export function VerdictRow({ endpoint, expanded, onToggle }: VerdictRowProps) {
  const detailsId = `endpoint-${endpoint.id}-sources`;
  return (
    <tbody className={cn("border-t border-border", expanded && "bg-surface-subtle")}>
      <tr className="align-top">
        <td className="py-3.5 pr-1 pl-4">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={`Sources for ${endpoint.name}`}
            onClick={onToggle}
            className="inline-flex size-6 items-center justify-center rounded-control text-muted hover:bg-bg hover:text-text"
          >
            <Icon name={expanded ? "chevron-down" : "chevron-right"} className="size-4" />
          </button>
        </td>
        <th scope="row" className="py-3.5 pr-4 text-left font-normal">
          <span className="block text-[13px] leading-snug font-semibold">{endpoint.name}</span>
          {endpoint.subtitle && (
            <span className="mt-0.5 block text-xs text-muted">{endpoint.subtitle}</span>
          )}
        </th>
        <td className="py-3.5 pr-4">
          <VerdictChip verdict={endpoint.verdict} />
        </td>
        <td className="py-3.5 pr-4">
          <GradeBadge grade={endpoint.grade} />
        </td>
        <td className="py-3.5 pr-6 text-[13px] leading-relaxed">
          {endpoint.basis}
          {endpoint.ood && <OodWarning text={endpoint.ood} />}
        </td>
      </tr>
      <tr id={detailsId} hidden={!expanded}>
        <td />
        <td colSpan={4} className="pr-6 pb-4">
          <SourceList sources={endpoint.sources} />
        </td>
      </tr>
    </tbody>
  );
}
