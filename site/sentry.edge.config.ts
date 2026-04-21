import * as Sentry from "@sentry/nextjs";

import { env } from "@/lib/env";

Sentry.init({
  dsn: env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN),
  environment: env.NODE_ENV,
  release: env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
});
