"use client";

import { useTransition } from "react";
import { switchWorkspace } from "@/app/actions/workspace";
import { Icon } from "@/components/ui/Icon";
import { Menu, MenuGroup, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { NOT_CONNECTED, useNotice } from "@/components/ui/Notice";
import type { SessionUser, Workspace } from "@/lib/types/domain";
import { useScreen } from "./screenState";

export interface UserMenuProps {
  user: SessionUser;
  workspaces: Workspace[];
  activeWorkspaceId: string;
}

/** C02: the signed-in user's own workspaces, and Sign out. */
export function UserMenu({ user, workspaces, activeWorkspaceId }: UserMenuProps) {
  const { state, dispatch } = useScreen();
  const notify = useNotice();
  const [, startTransition] = useTransition();
  const active = workspaces.find((w) => w.id === activeWorkspaceId);

  function choose(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) return;
    startTransition(async () => {
      const result = await switchWorkspace({ workspaceId });
      if (result.ok) dispatch({ type: "workspaceChanged" });
      else notify(result.error.message);
    });
  }

  return (
    <Menu
      label="Account"
      align="end"
      open={state.openMenu === "user"}
      onOpenChange={(o) => dispatch({ type: "setOpenMenu", menu: o ? "user" : null })}
      triggerLabel={`${user.name}, ${active?.name ?? "no workspace"}`}
      triggerClassName="flex items-center gap-2.5 rounded-control px-1.5 py-1 hover:bg-bg"
      trigger={
        <>
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-bg font-mono text-xs font-semibold"
          >
            {user.initials}
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[13px] font-semibold">{user.name}</span>
            <span className="block text-[11px] text-muted">{active?.name}</span>
          </span>
          <Icon name="chevron-down" className="size-3.5 text-muted" />
        </>
      }
      menuClassName="w-72"
    >
      <MenuGroup label="Workspace">
        {workspaces.map((w) => (
          <MenuItem key={w.id} checked={w.id === activeWorkspaceId} onSelect={() => choose(w.id)}>
            {w.name}
          </MenuItem>
        ))}
      </MenuGroup>
      <MenuSeparator />
      {/* TODO(phase-2): real sign-out once authentication exists. */}
      <MenuItem onSelect={() => notify(NOT_CONNECTED)}>Sign out</MenuItem>
    </Menu>
  );
}
