import { NextRequest } from "next/server";

import type { ReservationStatusResponse } from "@/lib/api/types";
import { prisma } from "@/lib/prisma";
import { jsonNoStore } from "@/lib/responses";
import { expireReservation } from "@/lib/reservation-service";
import { captureException, logRoute } from "@/lib/telemetry";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const startedAt = Date.now();
  const route = "/api/reservation/[id]/status";

  try {
    await expireReservation(params.id);
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    });

    if (!reservation) {
      const response = jsonNoStore(
        {
          error: "NOT_FOUND",
          message: "Reservation was not found.",
        },
        { status: 404 },
      );
      logRoute(route, Date.now() - startedAt, 404);
      return response;
    }

    const response = jsonNoStore<ReservationStatusResponse>({
      reservationId: reservation.id,
      status: reservation.status,
      expiresAt: reservation.expiresAt.toISOString(),
      confirmedAt: reservation.confirmedAt?.toISOString() ?? null,
    });
    logRoute(route, Date.now() - startedAt, 200);
    return response;
  } catch (error) {
    captureException(error, { route, reservationId: params.id });
    const response = jsonNoStore(
      { error: "STATUS_UNAVAILABLE", message: "Reservation status is unavailable." },
      { status: 500 },
    );
    logRoute(route, Date.now() - startedAt, 500);
    return response;
  }
}
