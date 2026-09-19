import "server-only";
import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/types/domain";

// Mock session for Phase 1. Real authentication replaces only this file (TODO(phase-2)).
// The rest of the app treats the session as the only source of user and workspace scope.

export const WORKSPACE_COOKIE = "es_workspace";

const MOCK_USER: SessionUser = { id: "usr_motun", name: "M. Otun", initials: "MO" };

/** Workspaces the signed-in user owns. Later this comes from the database, keyed by user. */
const MOCK_WORKSPACE_IDS: readonly string[] = ["wsp_formulation", "wsp_discovery"];

export interface Session {
  user: SessionUser;
  /** Every workspace this user owns. */
  workspaceIds: readonly string[];
  /** The active workspace; always one of `workspaceIds`. */
  workspaceId: string;
}

export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const requested = cookieStore.get(WORKSPACE_COOKIE)?.value;
  // A cookie naming a workspace the user doesn't own is ignored, never trusted.
  const workspaceId =
    requested && MOCK_WORKSPACE_IDS.includes(requested) ? requested : MOCK_WORKSPACE_IDS[0]!;
  return { user: MOCK_USER, workspaceIds: MOCK_WORKSPACE_IDS, workspaceId };
}

/**
 * Makes `workspaceId` the active workspace if the session user owns it.
 * Call only from a Server Action or Route Handler (cookies can't be set while rendering).
 */
export async function setActiveWorkspace(workspaceId: string): Promise<boolean> {
  const session = await getSession();
  if (!session.workspaceIds.includes(workspaceId)) return false;
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return true;
}
