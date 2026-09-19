import { Card } from "@/components/ui/Card";

export interface SkeletonMatrixProps {
  /** 1-based step in progress, for "Filling in as steps complete · step 3 of 4". */
  step: number;
}

const ROWS = ["w-full", "w-3/4", "w-5/6", "w-2/3"];

/** Placeholder verdict matrix while the run is in progress (S04). */
export function SkeletonMatrix({ step }: SkeletonMatrixProps) {
  return (
    <Card aria-busy="true" aria-labelledby="skeleton-matrix-title" className="animate-reveal">
      <div className="flex items-baseline gap-3 border-b border-border px-6 py-4">
        <h2 id="skeleton-matrix-title" className="text-[15px] font-semibold">
          Verdict matrix
        </h2>
        <p className="text-[13px] text-muted">Filling in as steps complete · step {step} of 4</p>
      </div>
      <div aria-hidden="true" className="space-y-5 px-6 py-6">
        {ROWS.map((basisWidth, i) => (
          <div key={i} className="grid grid-cols-[1.4fr_1.6fr_2.25rem_5fr] gap-4">
            <span className="h-3.5 rounded-full bg-bg" />
            <span className="h-5 rounded-full bg-bg" />
            <span className="h-5 rounded-control bg-bg" />
            <span className={`h-3.5 rounded-full bg-bg ${basisWidth}`} />
          </div>
        ))}
      </div>
    </Card>
  );
}
