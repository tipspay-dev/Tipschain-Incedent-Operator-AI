import { ReservationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trackServerEvent } from "@/lib/analytics";
import { requireJson } from "@/lib/api-guard";
import type { OtpVerifyResponse } from "@/lib/api/types";
import { isReservationEnabled } from "@/lib/feature-flag";
import { hashOtpCode } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { jsonNoStore } from "@/lib/responses";
import { withRateLimit } from "@/lib/rate-limit";
import { createSessionResponse } from "@/lib/session-service";
import { captureException, logRoute } from "@/lib/telemetry";

const verifySchema = z.object({
  reservationId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/),
});

async function handler(request: NextRequest) {
  const startedAt = Date.now();
  const route = "/api/otp/verify";

  try {
    if (!(await isReservationEnabled())) {
      const response = jsonNoStore(
        {
          verified: false,
          error: "MAINTENANCE",
          message: "Reservation flow is paused.",
        } satisfies OtpVerifyResponse,
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

    const parsed = verifySchema.safeParse(await request.json());
    if (!parsed.success) {
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: "INVALID_CODE",
          message: "OTP format is invalid.",
        },
        { status: 400 },
      );
      logRoute(route, Date.now() - startedAt, 400);
      return response;
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservationId },
      include: { otpChallenge: true },
    });

    if (!reservation || !reservation.otpChallenge) {
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: "NOT_FOUND",
          message: "Reservation or OTP challenge was not found.",
        },
        { status: 404 },
      );
      logRoute(route, Date.now() - startedAt, 404);
      return response;
    }

    if (reservation.status === ReservationStatus.CONFIRMED) {
      const sessionResponse = await createSessionResponse(reservation.id);
      const payload = await sessionResponse.clone().json();
      const response = NextResponse.json<OtpVerifyResponse>({
        verified: true,
        sessionToken: payload.token,
        redirectUrl: payload.redirectUrl,
      });
      response.headers.set("Cache-Control", "no-store");
      const cookieHeader = sessionResponse.headers.get("set-cookie");
      if (cookieHeader) {
        response.headers.set("set-cookie", cookieHeader);
      }
      logRoute(route, Date.now() - startedAt, 200);
      return response;
    }

    if (reservation.expiresAt <= new Date()) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.EXPIRED },
      });
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: "EXPIRED",
          message: "Your reservation expired — start over.",
        },
        { status: 410 },
      );
      logRoute(route, Date.now() - startedAt, 410);
      return response;
    }

    if (
      reservation.otpChallenge.lockedAt ||
      reservation.otpChallenge.attemptCount >= 5
    ) {
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: "LOCKED",
          message: "Too many invalid attempts. Request a new code later.",
          retryAfterSeconds: 300,
        },
        { status: 429 },
      );
      response.headers.set("Retry-After", "300");
      logRoute(route, Date.now() - startedAt, 429);
      return response;
    }

    if (reservation.otpChallenge.expiresAt <= new Date()) {
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: "EXPIRED",
          message: "Your verification code expired. Request a new one.",
        },
        { status: 410 },
      );
      logRoute(route, Date.now() - startedAt, 410);
      return response;
    }

    const inputHash = hashOtpCode(parsed.data.code);
    if (inputHash !== reservation.otpChallenge.codeHash) {
      const challenge = await prisma.otpChallenge.update({
        where: { reservationId: reservation.id },
        data: {
          attemptCount: { increment: 1 },
          lockedAt:
            reservation.otpChallenge.attemptCount + 1 >= 5 ? new Date() : null,
        },
      });

      const isLocked = challenge.attemptCount >= 5 || Boolean(challenge.lockedAt);
      const response = jsonNoStore<OtpVerifyResponse>(
        {
          verified: false,
          error: isLocked ? "LOCKED" : "INVALID_CODE",
          message: isLocked
            ? "Too many invalid attempts. Request a new code later."
            : "The code you entered is not correct.",
          retryAfterSeconds: isLocked ? 300 : undefined,
        },
        { status: isLocked ? 429 : 401 },
      );

      if (isLocked) {
        response.headers.set("Retry-After", "300");
      }

      logRoute(route, Date.now() - startedAt, response.status);
      return response;
    }

    await prisma.$transaction([
      prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      }),
      prisma.otpChallenge.delete({
        where: { reservationId: reservation.id },
      }),
    ]);

    const sessionResponse = await createSessionResponse(reservation.id);
    const sessionPayload = await sessionResponse.clone().json();

    await trackServerEvent("otp_verified", reservation.id, {
      reservationId: reservation.id,
      username: reservation.username,
    });

    const response = NextResponse.json<OtpVerifyResponse>({
      verified: true,
      sessionToken: sessionPayload.token,
      redirectUrl: sessionPayload.redirectUrl,
    });
    response.headers.set("Cache-Control", "no-store");

    const cookieHeader = sessionResponse.headers.get("set-cookie");
    if (cookieHeader) {
      response.headers.set("set-cookie", cookieHeader);
    }

    logRoute(route, Date.now() - startedAt, 200);
    return response;
  } catch (error) {
    captureException(error, { route });
    const response = jsonNoStore<OtpVerifyResponse>(
      {
        verified: false,
        error: "INVALID_CODE",
        message: "Verification failed.",
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
    return `otp-verify:${String(body.reservationId ?? "unknown")}`;
  },
  5,
  300,
  handler,
);
