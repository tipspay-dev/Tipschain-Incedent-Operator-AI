import { ReservationStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import type { SessionCreateResponse } from "@/lib/api/types";
import { requireJson } from "@/lib/api-guard";
import { isReservationEnabled } from "@/lib/feature-flag";
import { jsonNoStore } from "@/lib/responses";
import { captureException, logRoute } from "@/lib/telemetry";
const sessionSchema = z.object({
  reservationId: z.string().uuid(),
});
import { createSessionResponse } from "@/lib/session-service";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const route = "/api/session/create";

  try {
    if (!(await isReservationEnabled())) {
      const response = jsonNoStore(
        { error: "MAINTENANCE", message: "Reservation flow is paused." },
        { status: 503 },
      );
      logRoute(route, Date.now() - startedAt, 503);
      return response;
    }

    const invalidContentType = requireJson(request);
    if (invalidContentType) {
      logRoute(route, Date.now() - startedAt, 400);
      return invalidContentType;
    }

    const parsed = sessionSchema.safeParse(await request.json());
    if (!parsed.success) {
      const response = jsonNoStore<SessionCreateResponse>(
        {
          error: "INVALID_STATE",
          message: "Reservation identifier is invalid.",
        },
        { status: 400 },
      );
      logRoute(route, Date.now() - startedAt, 400);
      return response;
    }

    const response = await createSessionResponse(parsed.data.reservationId);
    logRoute(route, Date.now() - startedAt, response.status);
    return response;
  } catch (error) {
    captureException(error, { route });
    const response = jsonNoStore<SessionCreateResponse>(
      {
        error: "INVALID_STATE",
        message: "Session could not be created.",
      },
      { status: 500 },
    );
    logRoute(route, Date.now() - startedAt, 500);
    return response;
  }
}
