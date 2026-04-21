import { Resend } from "resend";
import twilio from "twilio";

import { env } from "@/lib/env";

let cachedResend: Resend | null = null;
let cachedTwilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    return null;
  }

  if (!cachedTwilioClient) {
    cachedTwilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  }

  return cachedTwilioClient;
}

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!cachedResend) {
    cachedResend = new Resend(env.RESEND_API_KEY);
  }

  return cachedResend;
}

export async function sendOtpMessage(input: {
  code: string;
  phone: string | null;
  email: string | null;
  username: string;
}) {
  const message = `Your Tipspay verification code is ${input.code}. It expires in 5 minutes.`;
  const simulatedChannel = input.phone ? "sms" : "email";

  if (env.OTP_OVERRIDE_CODE && env.NODE_ENV !== "production") {
    console.log(
      JSON.stringify({
        route: "/api/otp/send",
        status: "simulated",
        channel: simulatedChannel,
        username: input.username,
        destination: input.phone ?? input.email,
        ts: new Date().toISOString(),
      }),
    );
    return simulatedChannel;
  }

  if (input.phone) {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      throw new Error("Twilio SMS delivery is not configured.");
    }

    const client = getTwilioClient();
    if (!client) {
      throw new Error("Twilio SMS delivery is not configured.");
    }
    await client.messages.create({
      body: message,
      from: env.TWILIO_FROM_NUMBER,
      to: input.phone,
    });

    return "sms" as const;
  }

  if (input.email) {
    const resend = getResendClient();
    if (!resend) {
      throw new Error("Resend email delivery is not configured.");
    }

    await resend.emails.send({
      from: env.OTP_EMAIL_FROM,
      to: input.email,
      subject: `Your Tipspay access code for @${input.username}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#050816;color:#ffffff;padding:24px">
          <h1 style="font-size:24px;margin-bottom:16px">Tipspay verification</h1>
          <p style="font-size:16px;line-height:1.6">Use the code below to finish reserving your Tipspay username.</p>
          <div style="margin:24px 0;padding:18px;border-radius:16px;background:#10192d;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${input.code}</div>
          <p style="font-size:14px;line-height:1.6;color:#b7c1d8">This code expires in 5 minutes. If you did not request this code, you can ignore this email.</p>
        </div>
      `,
    });

    return "email" as const;
  }

  throw new Error("No delivery channel available.");
}
