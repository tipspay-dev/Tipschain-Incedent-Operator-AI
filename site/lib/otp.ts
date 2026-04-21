import crypto from "node:crypto";

import { env } from "@/lib/env";

export function generateOtpCode() {
  if (env.OTP_OVERRIDE_CODE && env.NODE_ENV !== "production") {
    return env.OTP_OVERRIDE_CODE;
  }

  return crypto.randomInt(100000, 999999).toString();
}

export function hashOtpCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  const maskedLocal =
    local.length <= 2
      ? `${local[0] ?? ""}*`
      : `${local.slice(0, 2)}${"*".repeat(Math.max(local.length - 2, 1))}`;
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const visibleTail = digits.slice(-2);
  return `+${"*".repeat(Math.max(digits.length - 2, 4))}${visibleTail}`;
}
