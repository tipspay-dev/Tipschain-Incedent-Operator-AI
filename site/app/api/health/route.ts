import { NextResponse } from "next/server";

import type { HealthResponse } from "@/lib/api/types";
import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { captureException, logRoute } from "@/lib/telemetry";

export async function GET() {
  const startedAt = Date.now();
  const route = "/api/health";
  let db = false;
  let redis = false;

  try {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    try {
      const client = getRedis();
      if (client) {
        await client.ping();
        redis = true;
      }
    } catch {
      redis = false;
    }

    const payload: HealthResponse = {
      status: db && redis ? "ok" : db || redis ? "degraded" : "down",
      db,
      redis,
      ts: new Date().toISOString(),
    };

    const response = NextResponse.json(payload, {
      status: payload.status === "down" ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
    logRoute(route, Date.now() - startedAt, response.status);
    return response;
  } catch (error) {
    captureException(error, { route });
    const response = NextResponse.json<HealthResponse>(
      {
        status: "down",
        db,
        redis,
        ts: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
    logRoute(route, Date.now() - startedAt, 503);
    return response;
  }
}
