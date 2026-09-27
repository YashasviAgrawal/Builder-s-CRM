import { createHash, timingSafeEqual } from "node:crypto";

import { after, NextResponse } from "next/server";

import { env } from "@/config/env";
import { runJobsForWindow } from "@/platform/jobs/run-window";
import { logger } from "@/platform/logger";

/**
 * Runs background jobs for about a minute on hosts without a worker process (Vercel). Call it every minute
 * from a scheduler (Supabase pg_cron + pg_net, see docs/runbooks/deployment.md) with
 * `Authorization: Bearer <CRON_SECRET>`. Disabled (404) while CRON_SECRET is not set.
 */
export const maxDuration = 60;

const WINDOW_MS = 45_000;
const STOP_TIMEOUT_MS = 10_000;

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

function authorized(header: string | null, secret: string): boolean {
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  return timingSafeEqual(sha256(token), sha256(secret));
}

async function handle(request: Request) {
  if (!env.CRON_SECRET) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!authorized(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  // Answer at once so the scheduler's HTTP timeout does not matter; the window runs after the response.
  after(() =>
    runJobsForWindow({ windowMs: WINDOW_MS, stopTimeoutMs: STOP_TIMEOUT_MS }).catch(
      (error: unknown) => logger.error({ err: error }, "serverless job window failed"),
    ),
  );
  return NextResponse.json(
    { status: "started" },
    { status: 202, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = handle;
export const POST = handle;
