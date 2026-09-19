import type { Verdict } from "@/lib/types/domain";
import type { Endpoint } from "@/lib/types/dossier";

/**
 * The novel-for-route rule (foundation state model): with no precedent at the route, no
 * endpoint may be Precedented or Supported without precedent; those become Data gap: test.
 * Grades, basis and sources are kept as the evidence behind the row.
 */
export function applyNovelRule(endpoints: readonly Endpoint[], novelForRoute: boolean): Endpoint[] {
  if (!novelForRoute) return [...endpoints];
  return endpoints.map((e) =>
    e.verdict === "prec" || e.verdict === "supp" ? { ...e, verdict: "gap" } : e,
  );
}

/** Rows per verdict for the matrix header. Each verdict is counted on its own; never summed. */
export function verdictCounts(endpoints: readonly Endpoint[]): Record<Verdict, number> {
  const counts: Record<Verdict, number> = { prec: 0, supp: 0, gap: 0, alert: 0 };
  for (const e of endpoints) counts[e.verdict] += 1;
  return counts;
}
