import { Prisma, ReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isValidUsername, normalizeUsername } from "@/lib/username";

export async function expireReservation(reservationId: string) {
  await prisma.reservation.updateMany({
    where: {
      id: reservationId,
      status: ReservationStatus.PENDING,
      expiresAt: { lte: new Date() },
    },
    data: {
      status: ReservationStatus.EXPIRED,
    },
  });
}

export async function expirePendingReservationsForUsername(username: string) {
  await prisma.reservation.updateMany({
    where: {
      username: normalizeUsername(username),
      status: ReservationStatus.PENDING,
      expiresAt: { lte: new Date() },
    },
    data: {
      status: ReservationStatus.EXPIRED,
    },
  });
}

export async function findBlockedOrReservedUsername(username: string) {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) {
    return { available: false, reason: "INVALID" as const };
  }

  await expirePendingReservationsForUsername(normalized);

  const [blocked, reserved] = await Promise.all([
    prisma.usernameBlocklist.findUnique({
      where: { username: normalized },
    }),
    prisma.reservation.findFirst({
      where: {
        username: normalized,
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (blocked) {
    return { available: false, reason: "BLOCKLISTED" as const };
  }

  if (reserved) {
    return { available: false, reason: "RESERVED" as const };
  }

  return { available: true as const };
}

export async function createPendingReservation(input: {
  username: string;
  email?: string;
  phone?: string;
}) {
  const normalized = normalizeUsername(input.username);
  if (!isValidUsername(normalized)) {
    throw new Error("VALIDATION_ERROR");
  }

  await expirePendingReservationsForUsername(normalized);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    return await prisma.reservation.create({
      data: {
        username: normalized,
        email: input.email ?? null,
        phone: input.phone ?? null,
        status: ReservationStatus.PENDING,
        expiresAt,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("ALREADY_RESERVED");
    }

    throw error;
  }
}
