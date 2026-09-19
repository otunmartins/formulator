import { z } from "zod";

// Shared domain types mirroring the data contract in context/00-foundation.md.
// Types are inferred from the schemas so each shape is defined once.

export const verdictSchema = z.enum(["prec", "supp", "gap", "alert"]);
export type Verdict = z.infer<typeof verdictSchema>;

export const gradeSchema = z.enum(["A", "B", "C", "D", "E"]);
export type Grade = z.infer<typeof gradeSchema>;

export const severitySchema = z.enum(["High", "Medium", "Low"]);
export type Severity = z.infer<typeof severitySchema>;

export const modeSchema = z.enum(["single", "batch"]);
export type Mode = z.infer<typeof modeSchema>;

export type RunState = "empty" | "running" | "identity_unresolved" | "error" | "complete";

export const stepKeys = ["identity", "precedent", "hazard", "liability"] as const;
export type StepKey = (typeof stepKeys)[number];

export const stepStatusSchema = z.enum(["pending", "active", "done", "error", "needs_input"]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

export const stepSchema = z.object({ status: stepStatusSchema, note: z.string().optional() });
export type Step = z.infer<typeof stepSchema>;
export type Steps = Record<StepKey, Step>;

export const routeSchema = z.enum(["SC", "IV", "IM"]);
export type Route = z.infer<typeof routeSchema>;

export const doseUnitSchema = z.enum(["mg", "mg/kg"]);
export type DoseUnit = z.infer<typeof doseUnitSchema>;

export const frequencySchema = z.enum(["once", "qd", "qw", "q2w", "q3w", "q4w"]);
export type Frequency = z.infer<typeof frequencySchema>;

export const storageSchema = z.union([z.literal(4), z.literal(25), z.literal(40)]);
export type StorageTemp = z.infer<typeof storageSchema>;

const positive = (label: string, max: number) =>
  z
    .number({ error: `Enter ${label}.` })
    .refine(Number.isFinite, `Enter ${label}.`)
    .refine((n) => n > 0, "Must be greater than 0.")
    .refine((n) => n <= max, `Must be at most ${max}.`);

export const runContextSchema = z.object({
  route: routeSchema,
  dose: z.object({ value: positive("a dose", 100_000), unit: doseUnitSchema }),
  frequency: frequencySchema,
  conc_mg_mL: positive("a concentration", 1_000),
  storage_C: storageSchema,
});
export type RunContext = z.infer<typeof runContextSchema>;

export const reviewSchema = z.object({
  status: z.enum(["draft", "signed"]),
  version: z.number().int().positive(),
  signedBy: z.string().optional(),
  signedAt: z.string().optional(),
});
export type Review = z.infer<typeof reviewSchema>;

export const runIdSchema = z.string().regex(/^RUN-\d{4}-\d{4}-\d{4}$/);

/** What the shell needs to list a run and fill the run header. Owner fields stay server-side. */
export const runSummarySchema = z.object({
  runId: runIdSchema,
  kind: z.enum(["single", "batch"]),
  title: z.string(),
  /** Null for batch runs, whose rows can differ in route. */
  route: routeSchema.nullable(),
  /** Null when the fixture doesn't carry the full context (shown as a visible placeholder). */
  context: runContextSchema.nullable(),
  createdAt: z.iso.datetime(),
  review: reviewSchema,
});
export type RunSummary = z.infer<typeof runSummarySchema>;

/** A stored run record: the summary plus its owner and workspace (data contract). */
export const runRecordSchema = runSummarySchema.extend({
  ownerId: z.string(),
  workspaceId: z.string(),
});
export type RunRecord = z.infer<typeof runRecordSchema>;

export const workspaceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
});
export type SessionUser = z.infer<typeof sessionUserSchema>;

/** Run events as the polling route handler returns them (Build 03 replays real scripts). */
export interface RunEvents {
  runId: string;
  steps: Steps;
  done: boolean;
}
