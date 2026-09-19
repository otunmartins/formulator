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
import type { Example, ProteinInput, RunRequest } from "@/lib/types/runInput";
import { lookupIdentity, lookupStructure } from "./inputs";
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

// Mock run numbers for runs started this session; high enough not to clash with fixtures.
let nextRunNumber = 5000;

function mockRunId(now: Date): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  const n = nextRunNumber++;
  return `RUN-${now.getFullYear()}-${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(n, 4)}`;
}

async function proteinLabel(protein: ProteinInput): Promise<string> {
  switch (protein.source) {
    case "pdb":
      return (await lookupStructure(protein.id))?.label ?? protein.id;
    case "uniprot":
      return protein.id;
    case "sequence":
      return "sequence input";
    case "upload":
      return protein.fileName;
    default: {
      const unreachable: never = protein;
      return unreachable;
    }
  }
}

/**
 * Starts a single run for the session user in the active workspace and returns its summary.
 * Phase 1 only builds the summary: nothing is stored or queued.
 * TODO(build-03): mock event script for this run. TODO(phase-2): insert Run + Job rows.
 */
export async function createRun(request: RunRequest): Promise<RunSummary> {
  await getSession();
  dataSource();
  const identity = await lookupIdentity(request.excipient.query);
  const excipientName = identity.status === "no_match" ? request.excipient.query : identity.name;
  const now = new Date();
  return runSummarySchema.parse({
    runId: mockRunId(now),
    kind: "single",
    title: `${excipientName} × ${await proteinLabel(request.protein)}`,
    route: request.context.route,
    context: request.context,
    createdAt: now.toISOString(),
    review: { status: "draft", version: 1 },
  });
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
