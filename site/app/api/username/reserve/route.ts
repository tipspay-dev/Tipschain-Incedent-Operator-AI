import { NextRequest } from "next/server";
import { z } from "zod";

import { trackServerEvent } from "@/lib/analytics";
import { requireJson } from "@/lib/api-guard";
import type { UsernameReserveResponse } from "@/lib/api/types";
import { isReservationEnabled } from "@/lib/feature-flag";
import { jsonNoStore } from "@/lib/responses";
import { createPendingReservation, findBlockedOrReservedUsername } from "@/lib/reservation-service";
import { captureException, logRoute } from "@/lib/telemetry";

const reserveSchema = z
  .object({
    username: z.string().min(1),
    phone: z.string().trim().min(6).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((value) => Boolean(value.phone || value.email), {
    message: "At least one contact method is required.",
    path: ["email"],
  });

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const route = "/api/username/reserve";

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

    const parsed = reserveSchema.safeParse(await request.json());
    if (!parsed.success) {
      const response = jsonNoStore<UsernameReserveResponse>(
        {
          error: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid request body.",
        },
        { status: 400 },
      );
      logRoute(route, Date.now() - startedAt, 400);
      return response;
    }

    const availability = await findBlockedOrReservedUsername(parsed.data.username);
    if (!availability.available) {
      const response = jsonNoStore<UsernameReserveResponse>(
        {
          error: "ALREADY_RESERVED",
          message: "That username is not available anymore.",
        },
        { status: 409 },
      );
      logRoute(route, Date.now() - startedAt, 409);
      return response;
    }

    try {
      const reservation = await createPendingReservation(parsed.data);
      await trackServerEvent("username_reserved", reservation.id, {
        username: reservation.username,
        hasEmail: Boolean(reservation.email),
        hasPhone: Boolean(reservation.phone),
      });

      const response = jsonNoStore<UsernameReserveResponse>({
        reservationId: reservation.id,
        expiresAt: reservation.expiresAt.toISOString(),
      });
      logRoute(route, Date.now() - startedAt, 200);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_RESERVED") {
        const response = jsonNoStore<UsernameReserveResponse>(
          {
            error: "ALREADY_RESERVED",
            message: "That username was just claimed by someone else.",
          },
          { status: 409 },
        );
        logRoute(route, Date.now() - startedAt, 409);
        return response;
      }

      if (error instanceof Error && error.message === "VALIDATION_ERROR") {
        const response = jsonNoStore<UsernameReserveResponse>(
          {
            error: "VALIDATION_ERROR",
            message: "Username must be 3 to 30 characters after sanitization.",
          },
          { status: 400 },
        );
        logRoute(route, Date.now() - startedAt, 400);
        return response;
      }

      throw error;
    }
  } catch (error) {
    captureException(error, { route });
    const response = jsonNoStore<UsernameReserveResponse>(
      {
        error: "VALIDATION_ERROR",
        message: "Reservation could not be created.",
      },
      { status: 500 },
    );
    logRoute(route, Date.now() - startedAt, 500);
    return response;
  }
}
