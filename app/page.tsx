import { Screen } from "@/components/shell/Screen";
import { listRecentRuns } from "@/lib/data/runs";
import { listWorkspaces } from "@/lib/data/workspaces";
import { formatRunTime } from "@/lib/utils/format";

// The one screen. Reads come from lib/data (session-scoped); everything after that
// changes in place inside <Screen>, with no navigation between steps.
export default async function Home() {
  const [{ user, workspaces, activeId }, runs] = await Promise.all([
    listWorkspaces(),
    listRecentRuns(),
  ]);
  const now = new Date();
  const recentRuns = runs.map((run) => ({ ...run, timeLabel: formatRunTime(run.createdAt, now) }));

  return <Screen data={{ user, workspaces, activeWorkspaceId: activeId, recentRuns }} />;
}
