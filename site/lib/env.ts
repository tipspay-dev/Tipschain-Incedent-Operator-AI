import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ENABLE_RESERVATION: z.string().default("false"),
  FEATURE_FLAG_PROVIDER: z.enum(["env", "launchdarkly", "statsig"]).default("env"),
  FEATURE_FLAG_LAUNCHDARKLY_KEY: z.string().default("enable-reservation"),
  FEATURE_FLAG_STATSIG_KEY: z.string().default("enable_reservation"),
  LAUNCHDARKLY_SDK_KEY: z.string().optional(),
  STATSIG_SERVER_SECRET: z.string().optional(),
  OTP_CODE_TTL_SECONDS: z.string().default("300"),
  OTP_RESERVATION_TTL_MINUTES: z.string().default("10"),
  OTP_OVERRIDE_CODE: z.string().optional(),
  JWT_SECRET: z.string().default("development-only-secret-change-me"),
  SESSION_COOKIE_NAME: z.string().default("tipspay_session"),
  NEXT_PUBLIC_POST_AUTH_URL: z.string().default("https://wallet.tipspay.org"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  OTP_EMAIL_FROM: z.string().default("Tipspay <auth@tipspay.org>"),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  MIXPANEL_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_GIT_COMMIT_SHA: z.string().default("local-dev"),
  CF_API_TOKEN: z.string().optional(),
  CF_ZONE_ID: z.string().optional(),
  STAGING_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export function isProduction() {
  return env.NODE_ENV === "production";
}
