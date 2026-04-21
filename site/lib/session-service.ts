import { ReservationStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { trackServerEvent } from "@/lib/analytics";
import type { SessionCreateResponse } from "@/lib/api/types";
import { applySessionCookie, createSessionForReservation } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonNoStore } from "@/lib/responses";

export async function createSessionResponse(reservationId: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    return jsonNoStore<SessionCreateResponse>(
      {
        error: "NOT_FOUND",
        message: "Reservation was not found.",
      },
      { status: 404 },
    );
  }

  if (reservation.status !== ReservationStatus.CONFIRMED) {
    return jsonNoStore<SessionCreateResponse>(
      {
        error: "INVALID_STATE",
        message: "Reservation must be confirmed before a session can be created.",
      },
      { status: 409 },
    );
  }

  const session = await createSessionForReservation(reservation);
  await trackServerEvent("session_created", reservation.id, {
    reservationId: reservation.id,
    username: reservation.username,
  });

  const response = NextResponse.json<SessionCreateResponse>({
    redirectUrl: session.redirectUrl,
    token: session.token,
  });

  response.headers.set("Cache-Control", "no-store");
  applySessionCookie(response, session.token);
  return response;
}
