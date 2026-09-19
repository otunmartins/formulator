import "server-only";

export type DataSource = "mock";

/**
 * The one place that reads USE_MOCKS. Phase 1 has only mocks, so anything else fails loudly
 * rather than silently returning fixtures. TODO(phase-2): add "db" (Prisma on Neon).
 */
export function dataSource(): DataSource {
  const value = process.env.USE_MOCKS ?? "true";
  if (value !== "true") {
    throw new Error("USE_MOCKS must be true in Phase 1: no database is wired yet.");
  }
  return "mock";
}
