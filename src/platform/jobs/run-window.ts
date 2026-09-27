import { setTimeout as sleep } from "node:timers/promises";

import { getServerRegistry } from "@/modules/registry.server";
import { logger } from "@/platform/logger";

import { startBoss } from "./boss";
import { recordWorkerHeartbeat } from "./heartbeat";
import { startJobWorkers } from "./runner";

/** One heartbeat row for every serverless run, so /api/health sees a live worker between runs. */
const SERVERLESS_WORKER_ID = "serverless";
const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * Runs the background worker for a bounded window, for hosts that cannot keep a worker process running
 * (e.g. Vercel). An external scheduler calls /api/jobs/run every minute; each call processes queued jobs and
 * event handlers, lets pg-boss send the cron occurrences that fell due, then stops. A job still running at the
 * end is abandoned after `stopTimeoutMs` and retried by a later run once it expires.
 */
export async function runJobsForWindow(options: {
  windowMs: number;
  stopTimeoutMs: number;
}): Promise<void> {
  const startedAt = new Date();
  const heartbeat = () =>
    recordWorkerHeartbeat(SERVERLESS_WORKER_ID, startedAt).catch((error: unknown) =>
      logger.warn({ err: error }, "heartbeat failed"),
    );

  const boss = await startBoss("worker");
  try {
    await startJobWorkers(boss, getServerRegistry());
    await heartbeat();
    logger.info({ windowMs: options.windowMs }, "serverless job window started");

    const endsAt = startedAt.getTime() + options.windowMs;
    while (Date.now() < endsAt) {
      await sleep(Math.min(HEARTBEAT_INTERVAL_MS, endsAt - Date.now()));
      await heartbeat();
    }
  } finally {
    await boss.stop({ graceful: true, timeout: options.stopTimeoutMs, close: true });
    logger.info({ ms: Date.now() - startedAt.getTime() }, "serverless job window finished");
  }
}
