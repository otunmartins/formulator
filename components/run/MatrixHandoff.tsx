import { Card } from "@/components/ui/Card";
import { NOT_CONNECTED } from "@/components/ui/Notice";

export interface MatrixHandoffProps {
  /**
   * Which endpoints the matrix may show: all of them when the run is complete, only the
   * precedent endpoints when a later step failed (S06).
   * TODO(build-04): take the run's endpoints and render verdict rows filtered by this scope.
   */
  scope: "all" | "precedent";
  /** The header line, e.g. "Precedent endpoints only · hazard step failed". */
  note: string;
}

/** Where Build 04's verdict matrix plugs in once steps have finished. */
export function MatrixHandoff({ scope, note }: MatrixHandoffProps) {
  return (
    <Card aria-labelledby="verdict-matrix-title" data-scope={scope} className="animate-reveal">
      <div className="flex items-baseline gap-3 border-b border-border px-6 py-4">
        <h2 id="verdict-matrix-title" className="text-[15px] font-semibold">
          Verdict matrix
        </h2>
        <p className="text-[13px] text-muted">{note}</p>
      </div>
      <p className="px-6 py-6 text-[13px] text-muted">
        Endpoint rows: {NOT_CONNECTED.toLowerCase()}.
      </p>
    </Card>
  );
}
