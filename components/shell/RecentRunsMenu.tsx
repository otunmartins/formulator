"use client";

import { useTransition } from "react";
import { openRun } from "@/app/actions/runs";
import { buttonClassName } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Menu, MenuGroup, MenuItem } from "@/components/ui/Menu";
import { useNotice } from "@/components/ui/Notice";
import { reviewLabel, shortRunId } from "@/lib/utils/format";
import { useScreen } from "./screenState";
import type { RecentRunItem } from "./types";

export interface RecentRunsMenuProps {
  runs: RecentRunItem[];
}

/** C01: the user's recent runs in the active workspace. A run loads into this same screen. */
export function RecentRunsMenu({ runs }: RecentRunsMenuProps) {
  const { state, dispatch } = useScreen();
  const notify = useNotice();
  const [pending, startTransition] = useTransition();

  function open(runId: string) {
    startTransition(async () => {
      const result = await openRun({ runId });
      if (result.ok) dispatch({ type: "loadRun", run: result.data });
      else notify(result.error.message);
    });
  }

  return (
    <Menu
      label="Recent runs"
      align="end"
      open={state.openMenu === "recent"}
      onOpenChange={(o) => dispatch({ type: "setOpenMenu", menu: o ? "recent" : null })}
      triggerClassName={buttonClassName("secondary", "md")}
      trigger={
        <>
          <Icon name="clock" />
          Recent runs
          <Icon name="chevron-down" className="size-3.5 text-muted" />
        </>
      }
      menuClassName="w-[440px]"
    >
      <MenuGroup label="Recent runs">
        {runs.length === 0 && (
          <p className="px-4 py-2 text-[13px] text-muted">No runs in this workspace yet.</p>
        )}
        {runs.map((run) => (
          <MenuItem key={run.runId} onSelect={() => open(run.runId)} className="py-2.5">
            <span className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {run.title}
                  {run.route && ` · ${run.route}`}
                </span>
                <span className="mt-0.5 block font-mono text-xs text-muted">
                  {shortRunId(run.runId)} · {run.timeLabel}
                </span>
              </span>
              <Chip mono tone={run.review.status === "signed" ? "signed" : "neutral"}>
                {reviewLabel(run.review)}
              </Chip>
            </span>
          </MenuItem>
        ))}
      </MenuGroup>
      {pending && <span className="sr-only">Loading run</span>}
    </Menu>
  );
}
