import "server-only";
import { getSession } from "@/lib/auth/session";
import { WORKSPACES } from "@/lib/mocks/workspaces";
import type { SessionUser, Workspace } from "@/lib/types/domain";
import { dataSource } from "./source";

export interface WorkspaceList {
  user: SessionUser;
  workspaces: Workspace[];
  activeId: string;
}

/** The session user's own workspaces, and which one is active. */
export async function listWorkspaces(): Promise<WorkspaceList> {
  const session = await getSession();
  dataSource();
  const workspaces = WORKSPACES.filter(
    (w) => w.ownerId === session.user.id && session.workspaceIds.includes(w.id),
  );
  return { user: session.user, workspaces, activeId: session.workspaceId };
}
