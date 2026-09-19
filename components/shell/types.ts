import type { RunSummary, SessionUser, Workspace } from "@/lib/types/domain";

/** A recent run with its time label already formatted on the server. */
export interface RecentRunItem extends RunSummary {
  timeLabel: string;
}

/** Everything the shell reads from lib/data, fetched by the page (a Server Component). */
export interface ShellData {
  user: SessionUser;
  workspaces: Workspace[];
  activeWorkspaceId: string;
  recentRuns: RecentRunItem[];
}
