"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { setActiveWorkspace } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/types/actions";

const switchWorkspaceInput = z.object({ workspaceId: z.string().min(1).max(64) });

/**
 * Makes one of the session user's own workspaces active, then refreshes the screen so
 * Recent runs reload for it. The target is checked against the session, never trusted.
 */
export async function switchWorkspace(input: unknown): Promise<ActionResult<null>> {
  const parsed = switchWorkspaceInput.safeParse(input);
  if (!parsed.success) return fail("invalid_input", "Choose a workspace.");
  const switched = await setActiveWorkspace(parsed.data.workspaceId);
  if (!switched) return fail("forbidden", "That workspace isn't available to you.");
  refresh();
  return ok(null);
}
