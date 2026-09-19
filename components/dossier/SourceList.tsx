import type { Source } from "@/lib/types/dossier";

export interface SourceListProps {
  sources: readonly Source[];
}

/** An endpoint's sources, each with its title and snapshot, edition or evidence class. */
export function SourceList({ sources }: SourceListProps) {
  return (
    <div>
      <h4 className="mb-2 font-mono text-[11px] font-medium tracking-widest text-muted uppercase">
        Sources ({sources.length})
      </h4>
      <ul className="space-y-1.5">
        {sources.map((source, i) => (
          <li
            key={`${source.title}-${i}`}
            className="flex items-baseline justify-between gap-4 rounded-control border border-border bg-surface px-3 py-2 text-[13px]"
          >
            <span className="min-w-0">{source.title}</span>
            <span className="shrink-0 font-mono text-xs text-muted">{source.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
