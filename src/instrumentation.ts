/**
 * Runs once when a Next.js server starts. Starts the job queue (pg-boss) in the background: its first start migrates
 * and creates every queue, which takes seconds on a distant database and must not happen inside the transaction of
 * the first request that publishes an event. Not awaited, so the server is ready at once; a failed start is logged
 * and retried by the next caller of `getBoss()`.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }
  const [{ getBoss }, { logger }] = await Promise.all([
    import("@/platform/jobs/boss"),
    import("@/platform/logger"),
  ]);
  getBoss().catch((error: unknown) => logger.warn({ err: error }, "job queue warm-up failed"));
}
