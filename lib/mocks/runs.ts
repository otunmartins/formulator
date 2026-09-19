import { runRecordSchema, type RunRecord } from "@/lib/types/domain";
import { exampleSchema, type Example } from "@/lib/types/runInput";

// Titles, IDs and statuses come from the reference screens (C01). Where a fixture doesn't
// carry a value, it is null and the UI shows a visible [PLACEHOLDER]; nothing is invented.

const PS80_CONTEXT = {
  route: "SC",
  dose: { value: 150, unit: "mg" },
  frequency: "q2w",
  conc_mg_mL: 0.2,
  storage_C: 25,
} as const;

const RUNS_RAW: RunRecord[] = [
  // Formulation workspace (C01)
  {
    runId: "RUN-2026-0918-0412",
    kind: "single",
    title: "Polysorbate 80 × 1N8Z Fab",
    route: "SC",
    context: { ...PS80_CONTEXT, dose: { ...PS80_CONTEXT.dose } },
    createdAt: "2026-09-18T14:12:00Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_formulation",
  },
  {
    runId: "RUN-2026-0917-0398",
    kind: "single",
    title: "Sucrose × 1N8Z Fab",
    route: "SC",
    context: null,
    createdAt: "2026-09-17T10:30:00Z",
    review: { status: "signed", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_formulation",
  },
  {
    runId: "RUN-2026-0916-0377",
    kind: "batch",
    title: "Batch · 4 excipients × 1N8Z Fab",
    route: null,
    context: null,
    createdAt: "2026-09-16T09:05:00Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_formulation",
  },
  {
    runId: "RUN-2026-0912-0341",
    kind: "single",
    title: "Poloxamer 188 × IgG1",
    route: "IV",
    context: null,
    createdAt: "2026-09-12T15:40:00Z",
    review: { status: "signed", version: 2 },
    ownerId: "usr_motun",
    workspaceId: "wsp_formulation",
  },
  // Discovery workspace: no screen content exists for these yet.
  {
    runId: "RUN-2026-0915-0360",
    kind: "single",
    title: "[PLACEHOLDER] Discovery run A",
    route: null,
    context: null,
    createdAt: "2026-09-15T11:00:00Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_discovery",
  },
  {
    runId: "RUN-2026-0910-0322",
    kind: "single",
    title: "[PLACEHOLDER] Discovery run B",
    route: null,
    context: null,
    createdAt: "2026-09-10T08:20:00Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_motun",
    workspaceId: "wsp_discovery",
  },
  // Another user's run: must never be listed or opened by usr_motun.
  {
    runId: "RUN-2026-0918-0999",
    kind: "single",
    title: "Other user's run",
    route: "SC",
    context: null,
    createdAt: "2026-09-18T12:00:00Z",
    review: { status: "draft", version: 1 },
    ownerId: "usr_other",
    workspaceId: "wsp_other",
  },
];

// Validate fixture shapes at load so a bad fixture fails loudly (CODING_STANDARDS §1).
export const RUNS: readonly RunRecord[] = RUNS_RAW.map((r) => runRecordSchema.parse(r));

// "Load example": PS80 × 1N8Z inputs as shown in the reference screens (S03) and the
// data contract (polymer, chains A + B with antigen chain C excluded).
export const EXAMPLE: Example = exampleSchema.parse({
  title: "Polysorbate 80 × 1N8Z Fab",
  input: {
    excipient: {
      query: "Polysorbate 80",
      polymer: {
        repeatUnit: "-(CH2CH2O)-",
        endGroups: "Sorbitan monooleate ester / –OH",
        dp: "w+x+y+z ≈ 20",
        residualMonomers: ["Ethylene oxide", "1,4-dioxane"],
      },
    },
    protein: { source: "pdb", id: "1N8Z", chains: ["A", "B"], excludedChains: ["C"] },
    context: PS80_CONTEXT,
  },
});
