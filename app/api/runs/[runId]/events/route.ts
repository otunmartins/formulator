import { getRunEvents } from "@/lib/data/runs";
import { runIdSchema } from "@/lib/types/domain";

// Polled by the client every 1–2 s while a run is in progress (no long-lived streams).
export async function GET(_request: Request, ctx: RouteContext<"/api/runs/[runId]/events">) {
  const { runId } = await ctx.params;
  if (!runIdSchema.safeParse(runId).success) {
    return Response.json({ error: { code: "invalid_input" } }, { status: 400 });
  }
  const events = await getRunEvents(runId);
  if (!events) return Response.json({ error: { code: "not_found" } }, { status: 404 });
  return Response.json(events, { headers: { "Cache-Control": "no-store" } });
}
