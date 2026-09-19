import "server-only";
import { getSession } from "@/lib/auth/session";
import { EXAMPLE, RUNS } from "@/lib/mocks/runs";
import {
  candidatesFor,
  HAZARD_FAIL_TRIGGER,
  PS80_1N8Z_NOTES,
  timelineAt,
  type StoredRun,
} from "@/lib/mocks/runScripts";
import {
  runSummarySchema,
  type RunRecord,
  type RunSummary,
  type StepKey,
} from "@/lib/types/domain";
import type { RunEvents, RunScript } from "@/lib/types/runEvents";
import type { Example, ProteinInput, RunRequest } from "@/lib/types/runInput";
import { lookupIdentity, lookupStructure } from "./inputs";
import { findStoredRun, listStoredRuns, saveStoredRun } from "./runStore";
import { dataSource } from "./source";

function toSummary(record: RunRecord): RunSummary {
  // Owner fields and mock state stay on the server.
  return runSummarySchema.strip().parse(record);
}

/** Fixture runs the session user owns in the active workspace. */
async function scopedFixtureRuns(): Promise<RunRecord[]> {
  const session = await getSession();
  dataSource();
  return RUNS.filter((r) => r.ownerId === session.user.id && r.workspaceId === session.workspaceId);
}

/** Recent runs in the active workspace (started here and fixtures), newest first. */
export async function listRecentRuns(limit = 10): Promise<RunSummary[]> {
  const runs: RunRecord[] = [...(await listStoredRuns()), ...(await scopedFixtureRuns())];
  return runs
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map(toSummary);
}

/** A run's summary, or null if it doesn't exist in this user's active workspace. */
export async function getRunSummary(runId: string): Promise<RunSummary | null> {
  const run =
    (await findStoredRun(runId)) ?? (await scopedFixtureRuns()).find((r) => r.runId === runId);
  return run ? toSummary(run) : null;
}

/** The "Load example" starting point. Not user data, but still behind the session. */
export async function getExample(): Promise<Example> {
  await getSession();
  dataSource();
  return EXAMPLE;
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

/** A run number from the clock, unique among this user's stored runs. */
function mockRunId(now: Date, taken: ReadonlySet<string>): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  const prefix = `RUN-${now.getFullYear()}-${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  let n = 1000 + (Math.floor(now.getTime() / 1000) % 9000);
  while (taken.has(`${prefix}-${pad(n, 4)}`)) n = n === 9999 ? 1000 : n + 1;
  return `${prefix}-${pad(n, 4)}`;
}

const COMPLETE = "Complete";

/**
 * Starts a single run for the session user in the active workspace and returns its summary.
 * The mock picks an event script from the input (Build 03 decisions): "Polysorbate 20" fails at
 * the hazard step, an excipient with no registry match pauses at identity, anything else runs
 * through. Call only from a Server Action (it writes the run-store cookie).
 * TODO(phase-2): insert Run + Job rows for the worker instead.
 */
export async function createRun(request: RunRequest, now = new Date()): Promise<RunSummary> {
  const session = await getSession();
  dataSource();
  const query = request.excipient.query.trim();
  const identity = await lookupIdentity(query);
  const protein = await proteinLabel(request.protein);

  let script: RunScript = "happy";
  let name = query;
  let identityNote = COMPLETE;
  if (query.toLowerCase() === HAZARD_FAIL_TRIGGER) {
    script = "hazard_fail";
    name = "Polysorbate 20";
    identityNote = "Polysorbate 20 · CAS [PLACEHOLDER]";
  } else if (identity.status === "no_match") {
    script = "unresolved";
  } else if (identity.status === "resolved") {
    name = identity.name;
    identityNote = `${identity.name} · CAS ${identity.cas}`;
  } else {
    name = identity.name;
    identityNote = `${identity.name} · user SMILES`;
  }
  const isPs80On1N8Z =
    identity.status === "resolved" &&
    identity.name === "Polysorbate 80" &&
    request.protein.source === "pdb" &&
    request.protein.id === "1N8Z";
  const later = isPs80On1N8Z
    ? PS80_1N8Z_NOTES
    : { precedent: COMPLETE, hazard: COMPLETE, liability: COMPLETE };

  const taken = new Set((await listStoredRuns()).map((r) => r.runId));
  const run: StoredRun = {
    runId: mockRunId(now, taken),
    kind: "single",
    title: `${name} × ${protein}`,
    route: request.context.route,
    context: request.context,
    createdAt: now.toISOString(),
    review: { status: "draft", version: 1 },
    ownerId: session.user.id,
    workspaceId: session.workspaceId,
    script,
    query,
    notes: { identity: identityNote, ...later },
    startedAt: now.getTime(),
    retries: [],
  };
  await saveStoredRun(run);
  return toSummary(run);
}

/** Fixture runs have finished; show them complete (PS80 × 1N8Z with its screen notes). */
function fixtureAsStored(record: RunRecord): StoredRun {
  const ps80 = record.runId === "RUN-2026-0918-0412";
  return {
    ...record,
    script: "happy",
    query: record.title,
    notes: ps80
      ? { identity: "Polysorbate 80 · CAS 9005-65-6", ...PS80_1N8Z_NOTES }
      : { identity: COMPLETE, precedent: COMPLETE, hazard: COMPLETE, liability: COMPLETE },
    startedAt: 0,
    retries: [],
  };
}

/** Progress for one of the user's runs, as the polling route handler returns it. */
export async function getRunEvents(runId: string, now = Date.now()): Promise<RunEvents | null> {
  const stored = await findStoredRun(runId);
  if (stored) return timelineAt(stored, now);
  const fixture = (await scopedFixtureRuns()).find((r) => r.runId === runId);
  return fixture ? timelineAt(fixtureAsStored(fixture), now) : null;
}

export type IdentityChoice =
  | { kind: "candidate"; candidateId: string }
  | { kind: "override"; value: string; format: "cas" | "smiles" };

export type RunUpdateError = "not_found" | "not_waiting" | "unknown_candidate";

/**
 * Resolves a paused identity step with a candidate or an override, recorded with the user's
 * name and the time (for the run manifest, Build 07). The run resumes at Precedent.
 */
export async function resolveRunIdentity(
  runId: string,
  choice: IdentityChoice,
  now = Date.now(),
): Promise<RunEvents | RunUpdateError> {
  const session = await getSession();
  const run = await findStoredRun(runId);
  if (!run) return "not_found";
  if (timelineAt(run, now).runState !== "identity_unresolved") return "not_waiting";

  let value: string;
  let note: string;
  if (choice.kind === "candidate") {
    const candidate = candidatesFor(run.query).find((c) => c.id === choice.candidateId);
    if (!candidate) return "unknown_candidate";
    value = candidate.id;
    note = `${candidate.name} · CAS ${candidate.cas}`;
  } else {
    value = choice.value;
    note = choice.format === "cas" ? `Override · CAS ${choice.value}` : "Override · SMILES";
  }
  const resolved: StoredRun = {
    ...run,
    notes: { ...run.notes, identity: note },
    resolution: { at: now, kind: choice.kind, value, note, by: session.user.name },
  };
  await saveStoredRun(resolved);
  return timelineAt(resolved, now);
}

/** Retries a failed step. Completed steps are kept; the run resumes at the failed step. */
export async function retryRunStep(
  runId: string,
  step: StepKey,
  now = Date.now(),
): Promise<RunEvents | RunUpdateError> {
  const run = await findStoredRun(runId);
  if (!run) return "not_found";
  const current = timelineAt(run, now);
  if (current.runState !== "error" || current.failure?.step !== step) return "not_waiting";
  const retried: StoredRun = { ...run, retries: [...run.retries, { step, at: now }] };
  await saveStoredRun(retried);
  return timelineAt(retried, now);
}

/** Simulation job status. No jobs exist before Build 06. TODO(build-06): mock job replay. */
export async function getSimulationStatus(jobId: string): Promise<null> {
  await getSession();
  dataSource();
  void jobId;
  return null;
}
