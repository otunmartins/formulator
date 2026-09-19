import "server-only";
import { getSession } from "@/lib/auth/session";
import { EXAMPLE, RUNS } from "@/lib/mocks/runs";
import {
  runSummarySchema,
  stepKeys,
  type RunEvents,
  type RunRecord,
  type RunSummary,
  type Steps,
} from "@/lib/types/domain";
import type { Example } from "@/lib/types/runInput";
import { dataSource } from "./source";

function toSummary(record: RunRecord): RunSummary {
  // Owner fields stay on the server.
  return runSummarySchema.strip().parse(record);
}

/** Runs the session user owns in the active workspace. Every lookup goes through here. */
async function scopedRuns(): Promise<RunRecord[]> {
  const session = await getSession();
  dataSource();
  return RUNS.filter((r) => r.ownerId === session.user.id && r.workspaceId === session.workspaceId);
}

/** Recent runs in the active workspace, newest first. */
export async function listRecentRuns(limit = 10): Promise<RunSummary[]> {
  const runs = await scopedRuns();
  return runs
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toSummary);
}

/** A run's summary, or null if it doesn't exist in this user's active workspace. */
export async function getRunSummary(runId: string): Promise<RunSummary | null> {
  const run = (await scopedRuns()).find((r) => r.runId === runId);
  return run ? toSummary(run) : null;
}

/** The "Load example" starting point. Not user data, but still behind the session. */
export async function getExample(): Promise<Example> {
  await getSession();
  dataSource();
  return EXAMPLE;
}

/**
 * Progress for a run, as the polling route handler returns it. Build 01 has no event
 * scripts, so every step is pending. TODO(build-03): replay mock event scripts on timers.
 */
export async function getRunEvents(runId: string): Promise<RunEvents | null> {
  const run = await getRunSummary(runId);
  if (!run) return null;
  const steps = Object.fromEntries(stepKeys.map((k) => [k, { status: "pending" }])) as Steps;
  return { runId: run.runId, steps, done: false };
}

/** Simulation job status. No jobs exist before Build 06. TODO(build-06): mock job replay. */
export async function getSimulationStatus(jobId: string): Promise<null> {
  await getSession();
  dataSource();
  void jobId;
  return null;
}
