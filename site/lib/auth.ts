import crypto from "node:crypto";

import { SignJWT, jwtVerify } from "jose";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function createSessionForReservation(reservation: {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
}) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({
    sid: sessionId,
    username: reservation.username,
    reservationId: reservation.id,
    contact: reservation.email ?? reservation.phone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(reservation.username)
    .setJti(sessionId)
    .setIssuer("tipspay.org")
    .setAudience("tipspay-launch")
    .sign(secret);

  await prisma.authSession.create({
    data: {
      id: sessionId,
      reservationId: reservation.id,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      expiresAt,
    },
  });

  return {
    token,
    redirectUrl: env.NEXT_PUBLIC_POST_AUTH_URL,
    sessionId,
    expiresAt,
  };
}

export function applySessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: env.SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

export async function verifySessionToken(token: string) {
  return jwtVerify(token, secret, {
    issuer: "tipspay.org",
    audience: "tipspay-launch",
  });
}
