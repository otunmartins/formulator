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

export const runContextSchema = z.object({
  route: routeSchema,
  dose: z.object({ value: z.number(), unit: z.string() }),
  frequency: z.string(),
  conc_mg_mL: z.number(),
  storage_C: z.number(),
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

/** What the shell needs to list a run and fill the run header. */
export const runSummarySchema = z.object({
  runId: runIdSchema,
  kind: z.enum(["single", "batch"]),
  title: z.string(),
  /** Null for batch runs, whose rows can differ in route. */
  context: runContextSchema.nullable(),
  createdAt: z.string().datetime(),
  review: reviewSchema,
  ownerId: z.string(),
  workspaceId: z.string(),
});
export type RunSummary = z.infer<typeof runSummarySchema>;

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
