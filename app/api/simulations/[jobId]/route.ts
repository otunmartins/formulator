import { z } from "zod";
import { getSimulationStatus } from "@/lib/data/runs";

const jobIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

// Polled by the simulation card. No jobs exist before Build 06, so every lookup is 404.
export async function GET(_request: Request, ctx: RouteContext<"/api/simulations/[jobId]">) {
  const { jobId } = await ctx.params;
  if (!jobIdSchema.safeParse(jobId).success) {
    return Response.json({ error: { code: "invalid_input" } }, { status: 400 });
  }
  const status = await getSimulationStatus(jobId);
  if (!status) return Response.json({ error: { code: "not_found" } }, { status: 404 });
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}
