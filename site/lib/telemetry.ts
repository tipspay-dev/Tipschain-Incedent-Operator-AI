import * as Sentry from "@sentry/nextjs";

export function captureException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function logRoute(route: string, durationMs: number, status: number) {
  console.log(
    JSON.stringify({
      route,
      durationMs,
      status,
      ts: new Date().toISOString(),
    }),
  );
}
