import { getDossier } from "@/lib/data/dossier";
import { runIdSchema } from "@/lib/types/domain";

// Fetched once by the client when a run settles with results (complete, or partial after a
// failed step). Scoped to the session user's active workspace inside lib/data.
export async function GET(_request: Request, ctx: RouteContext<"/api/runs/[runId]/dossier">) {
  const { runId } = await ctx.params;
  if (!runIdSchema.safeParse(runId).success) {
    return Response.json({ error: { code: "invalid_input" } }, { status: 400 });
  }
  const dossier = await getDossier(runId);
  if (dossier === "not_found") {
    return Response.json({ error: { code: "not_found" } }, { status: 404 });
  }
  if (dossier === "no_results") {
    return Response.json({ error: { code: "no_results" } }, { status: 409 });
  }
  return Response.json(dossier, { headers: { "Cache-Control": "no-store" } });
}
