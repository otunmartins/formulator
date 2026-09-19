import type { Workspace } from "@/lib/types/domain";

// `usr_other` exists only to prove that scoping hides other users' data.
export const WORKSPACES: readonly Workspace[] = [
  { id: "wsp_formulation", ownerId: "usr_motun", name: "Algonix AI · Formulation" },
  { id: "wsp_discovery", ownerId: "usr_motun", name: "Algonix AI · Discovery" },
  { id: "wsp_other", ownerId: "usr_other", name: "Other user · Workspace" },
];
