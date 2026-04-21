import { NextRequest } from "next/server";

import { trackServerEvent } from "@/lib/analytics";
import { isReservationEnabled } from "@/lib/feature-flag";
import type { UsernameCheckResponse } from "@/lib/api/types";
import { getClientIp } from "@/lib/request";
import { jsonCached, jsonNoStore } from "@/lib/responses";
import { findBlockedOrReservedUsername } from "@/lib/reservation-service";
import { withRateLimit } from "@/lib/rate-limit";
import { captureException, logRoute } from "@/lib/telemetry";
import { normalizeUsername } from "@/lib/username";

async function handler(request: NextRequest) {
  const startedAt = Date.now();
  const route = "/api/username/check";

  try {
    if (!(await isReservationEnabled())) {
      const response = jsonNoStore(
        { error: "MAINTENANCE" },
        { status: 503 },
      );
      logRoute(route, Date.now() - startedAt, 503);
      return response;
    }

    const rawUsername =
      request.nextUrl.searchParams.get("username")?.trim() ?? "";
    const username = normalizeUsername(rawUsername);
    const result = await findBlockedOrReservedUsername(username);

    const payload: UsernameCheckResponse = result.available
      ? { available: true }
      : { available: false, reason: result.reason };

    await trackServerEvent("username_checked", getClientIp(request), {
      username,
      available: result.available,
      reason: result.available ? null : result.reason,
    });

    const response = result.available
      ? jsonCached(payload, "public, max-age=5, stale-while-revalidate=10")
      : jsonNoStore(payload);

    logRoute(route, Date.now() - startedAt, 200);
    return response;
  } catch (error) {
    captureException(error, { route });
    const response = jsonNoStore(
      {
        available: false,
        reason: "INVALID",
      } satisfies UsernameCheckResponse,
      { status: 500 },
    );
    logRoute(route, Date.now() - startedAt, 500);
    return response;
  }
}

export const GET = withRateLimit(
  (request) => `username-check:${getClientIp(request)}`,
  10,
  60,
  handler,
);
