import { hostname } from "node:os";

import { getServerRegistry } from "@/modules/registry.server";
import { prisma } from "@/platform/db/client";

/** Records that a worker is alive (`worker_heartbeats`, read by /api/health). */
export async function recordWorkerHeartbeat(workerId: string, startedAt: Date): Promise<void> {
  const registry = getServerRegistry();
  await prisma.workerHeartbeat.upsert({
    where: { id: workerId },
    create: {
      id: workerId,
      hostname: hostname(),
      pid: process.pid,
      startedAt,
      lastSeenAt: new Date(),
      info: { jobs: registry.jobs.length, eventHandlers: registry.eventHandlers.length },
    },
    update: { hostname: hostname(), pid: process.pid, startedAt, lastSeenAt: new Date() },
  });
}
