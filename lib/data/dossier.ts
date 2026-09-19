import "server-only";
import { ENDPOINT_SETS } from "@/lib/mocks/endpoints";
import { timelineAt } from "@/lib/mocks/runScripts";
import type { Dossier } from "@/lib/types/dossier";
import { applyNovelRule } from "@/lib/utils/dossier";
import { findScopedRun } from "./runs";

export type DossierError = "not_found" | "no_results";

/**
 * The verdict matrix for one of the session user's runs. Complete runs return every
 * endpoint; a run whose later step failed returns only endpoints from completed steps (S06).
 * A run that is still running or paused has no results yet. The novel-for-route rule is
 * applied here, so no caller can show a positive verdict for a novel excipient.
 * TODO(phase-2): Endpoint and Source rows for the run version from Postgres.
 */
export async function getDossier(runId: string, now = Date.now()): Promise<Dossier | DossierError> {
  const run = await findScopedRun(runId);
  if (!run) return "not_found";
  const { runState, steps } = timelineAt(run, now);
  if (runState !== "complete" && runState !== "error") return "no_results";

  const set = run.endpointSet ? ENDPOINT_SETS[run.endpointSet] : null;
  const novelForRoute = set?.novelForRoute ?? false;
  const done = (set?.endpoints ?? []).filter((e) => steps[e.step].status === "done");
  return {
    runId: run.runId,
    novelForRoute,
    excipient: run.title.split(" × ")[0] ?? run.title,
    route: run.route,
    partial: runState === "error",
    hasFixture: set !== null,
    endpoints: applyNovelRule(done, novelForRoute),
  };
}
