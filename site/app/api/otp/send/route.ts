import { OtpChannel, ReservationStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

import { trackServerEvent } from "@/lib/analytics";
import { requireJson } from "@/lib/api-guard";
import type { OtpSendResponse } from "@/lib/api/types";
import { isReservationEnabled } from "@/lib/feature-flag";
import { sendOtpMessage } from "@/lib/messaging";
import { generateOtpCode, hashOtpCode, maskEmail, maskPhone } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { jsonNoStore } from "@/lib/responses";
import { withRateLimit } from "@/lib/rate-limit";
import { captureException, logRoute } from "@/lib/telemetry";

const sendSchema = z.object({
  reservationId: z.string().uuid(),
});

async function handler(request: NextRequest) {
  const startedAt = Date.now();
  const route = "/api/otp/send";

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

    const parsed = sendSchema.safeParse(await request.json());
    if (!parsed.success) {
      const response = jsonNoStore<OtpSendResponse>(
        {
          error: "NOT_FOUND",
          message: "Reservation identifier is invalid.",
        },
        { status: 400 },
      );
      logRoute(route, Date.now() - startedAt, 400);
      return response;
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservationId },
    });

    if (!reservation) {
      const response = jsonNoStore<OtpSendResponse>(
        { error: "NOT_FOUND", message: "Reservation was not found." },
        { status: 404 },
      );
      logRoute(route, Date.now() - startedAt, 404);
      return response;
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      const response = jsonNoStore<OtpSendResponse>(
        {
          error: "INVALID_STATE",
          message: "Reservation is not pending anymore.",
        },
        { status: 409 },
      );
      logRoute(route, Date.now() - startedAt, 409);
      return response;
    }

    if (reservation.expiresAt <= new Date()) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.EXPIRED },
      });
      const response = jsonNoStore<OtpSendResponse>(
        {
          error: "EXPIRED",
          message: "Reservation expired before OTP could be sent.",
        },
        { status: 410 },
      );
      logRoute(route, Date.now() - startedAt, 410);
      return response;
    }

    const code = generateOtpCode();
    const channel = reservation.phone ? OtpChannel.SMS : OtpChannel.EMAIL;

    await prisma.otpChallenge.upsert({
      where: { reservationId: reservation.id },
      create: {
        reservationId: reservation.id,
        codeHash: hashOtpCode(code),
        channel,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      update: {
        codeHash: hashOtpCode(code),
        channel,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attemptCount: 0,
        lockedAt: null,
        sentAt: new Date(),
      },
    });

    const deliveredChannel = await sendOtpMessage({
      code,
      phone: reservation.phone,
      email: reservation.email,
      username: reservation.username,
    });

    const maskedDestination = reservation.phone
      ? maskPhone(reservation.phone)
      : maskEmail(reservation.email ?? "");

    await trackServerEvent("otp_sent", reservation.id, {
      reservationId: reservation.id,
      channel: deliveredChannel,
    });

    const response = jsonNoStore<OtpSendResponse>({
      sent: true,
      channel: deliveredChannel,
      maskedDestination,
    });
    logRoute(route, Date.now() - startedAt, 200);
    return response;
  } catch (error) {
    captureException(error, { route });
    const response = jsonNoStore<OtpSendResponse>(
      {
        error: "INVALID_STATE",
        message: "OTP could not be sent.",
      },
      { status: 500 },
    );
    logRoute(route, Date.now() - startedAt, 500);
    return response;
  }
}

export const POST = withRateLimit(
  async (request) => {
    const body = await request.clone().json().catch(() => ({ reservationId: "unknown" }));
    return `otp-send:${String(body.reservationId ?? "unknown")}`;
  },
  3,
  600,
  handler,
);
