"use client";

import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { DevStateSwitcher } from "./DevStateSwitcher";
import type { Mode } from "@/lib/types/domain";
import { RecentRunsMenu } from "./RecentRunsMenu";
import { useScreen } from "./screenState";
import type { ShellData } from "./types";
import { UserMenu } from "./UserMenu";

const MODES = [
  { value: "single", label: "Single" },
  { value: "batch", label: "Batch" },
] as const satisfies readonly { value: Mode; label: string }[];

export interface TopBarProps {
  data: ShellData;
}

export function TopBar({ data }: TopBarProps) {
  const { state, dispatch } = useScreen();

  return (
    <header className="sticky top-0 z-30 flex h-topbar items-center gap-5 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-7 items-center justify-center rounded-control bg-accent text-on-accent">
          <Icon name="logo" className="size-4" />
        </span>
        <span className="text-[15px] font-semibold">Excipient Screen</span>
      </div>
      <Segmented
        label="Screen mode"
        options={MODES}
        value={state.mode}
        onChange={(mode) => dispatch({ type: "setMode", mode })}
      />
      <div className="ml-auto flex items-center gap-4">
        <DevStateSwitcher />
        <RecentRunsMenu runs={data.recentRuns} />
        <UserMenu
          user={data.user}
          workspaces={data.workspaces}
          activeWorkspaceId={data.activeWorkspaceId}
        />
      </div>
    </header>
  );
}
