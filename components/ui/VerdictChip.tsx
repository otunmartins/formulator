import type { Verdict } from "@/lib/types/domain";
import { verdictStyle } from "@/lib/utils/verdicts";
import { Chip } from "./Chip";

export interface VerdictChipProps {
  verdict: Verdict;
  /** Optional count prefix for summaries, e.g. "2 Data gap: test". */
  count?: number;
  className?: string;
}

/** A verdict as icon + text, never colour alone. Labels come from lib/utils/verdicts. */
export function VerdictChip({ verdict, count, className }: VerdictChipProps) {
  const style = verdictStyle(verdict);
  return (
    <Chip tone="custom" icon={style.icon} className={`${style.className} ${className ?? ""}`}>
      {count !== undefined && <span>{count}</span>}
      {style.label}
    </Chip>
  );
}
