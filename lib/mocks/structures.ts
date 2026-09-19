import type { StructureInfo } from "@/lib/types/lookups";

// Structure fixtures. 1N8Z: trastuzumab Fab (light chain A, heavy chain B) bound to the
// HER2 extracellular domain (chain C), as in the reference screens.
export const STRUCTURES: readonly StructureInfo[] = [
  {
    id: "1N8Z",
    label: "1N8Z Fab",
    chains: [
      { id: "A", label: "Light chain", excludedByDefault: false },
      { id: "B", label: "Heavy chain (Fab)", excludedByDefault: false },
      { id: "C", label: "Antigen", excludedByDefault: true },
    ],
  },
];
