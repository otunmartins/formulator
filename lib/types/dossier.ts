import { z } from "zod";
import { gradeSchema, verdictSchema } from "./domain";

// The dossier part of the data contract (context/00-foundation.md): endpoints with their
// verdict, evidence grade, basis and sources. Each endpoint stands alone; nothing is totalled.

export const sourceSchema = z.object({
  title: z.string().min(1),
  /** Snapshot date, edition or evidence class, e.g. "Experimental, class-level". */
  meta: z.string().min(1),
});
export type Source = z.infer<typeof sourceSchema>;

/** Which run step produced an endpoint; partial results after a failure keep only done steps. */
export const endpointStepSchema = z.enum(["precedent", "hazard"]);
export type EndpointStep = z.infer<typeof endpointStepSchema>;

export const endpointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string(),
  verdict: verdictSchema,
  grade: gradeSchema,
  basis: z.string().min(1),
  /** Out-of-domain warning, shown inline on grade D rows; null when in domain. */
  ood: z.string().nullable(),
  sources: z.array(sourceSchema),
  step: endpointStepSchema,
});
export type Endpoint = z.infer<typeof endpointSchema>;

/** What the dossier route returns for a run with results. */
export interface Dossier {
  runId: string;
  /** The excipient has no precedent at this route: no positive verdicts, banner shown. */
  novelForRoute: boolean;
  /** Excipient and route for the banner, e.g. "ALX-117" and "SC". */
  excipient: string;
  route: string | null;
  /** True when a later step failed and only completed steps' endpoints are included. */
  partial: boolean;
  /** False when no endpoint fixture exists for this excipient (shown as a placeholder row). */
  hasFixture: boolean;
  endpoints: Endpoint[];
}
