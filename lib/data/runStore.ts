import "server-only";
import { cookies } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { storedRunSchema, type StoredRun } from "@/lib/mocks/runScripts";
import { dataSource } from "./source";

// Mock run store (Phase 1). Runs started in this browser live in an httpOnly cookie, so any
// serverless instance can answer a poll without shared memory. Only server actions write it;
// every read is validated and scoped to the session user and workspace.
// TODO(phase-2): Run + RunEvent rows in Postgres; nothing outside lib/data changes.

const RUNS_COOKIE = "es_runs";
/** Browsers cap a cookie at about 4 KB; keep well under it. */
const MAX_COOKIE_CHARS = 3600;
const MAX_RUNS = 6;

function encode(runs: StoredRun[]): string {
  return Buffer.from(JSON.stringify(runs), "utf8").toString("base64url");
}

/** Every stored run in the cookie, newest first. Anything malformed is ignored, not trusted. */
async function readAll(): Promise<StoredRun[]> {
  const raw = (await cookies()).get(RUNS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const json: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = z.array(storedRunSchema).max(MAX_RUNS).safeParse(json);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Stored runs the session user owns in the active workspace, newest first. */
export async function listStoredRuns(): Promise<StoredRun[]> {
  const session = await getSession();
  dataSource();
  return (await readAll()).filter(
    (r) => r.ownerId === session.user.id && r.workspaceId === session.workspaceId,
  );
}

/** One of the session user's stored runs in the active workspace, or null. */
export async function findStoredRun(runId: string): Promise<StoredRun | null> {
  return (await listStoredRuns()).find((r) => r.runId === runId) ?? null;
}

/**
 * Inserts or replaces a run (newest first) for its owner. Call only from a Server Action:
 * cookies can't be set while rendering. Oldest runs are dropped to stay under the size cap.
 */
export async function saveStoredRun(run: StoredRun): Promise<void> {
  const session = await getSession();
  dataSource();
  if (run.ownerId !== session.user.id) throw new Error("Cannot store another user's run.");
  let runs = [run, ...(await readAll()).filter((r) => r.runId !== run.runId)].slice(0, MAX_RUNS);
  while (runs.length > 1 && encode(runs).length > MAX_COOKIE_CHARS) runs = runs.slice(0, -1);
  (await cookies()).set(RUNS_COOKIE, encode(runs), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}
