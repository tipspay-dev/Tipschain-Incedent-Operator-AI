import { PostHog } from "posthog-node";

import { env } from "@/lib/env";

type AnalyticsEvent =
  | "username_checked"
  | "username_reserved"
  | "otp_sent"
  | "otp_verified"
  | "session_created";

let posthogClient: PostHog | null = null;

function getPosthogClient() {
  if (!env.POSTHOG_KEY || !env.POSTHOG_HOST) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(env.POSTHOG_KEY, {
      host: env.POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

export async function trackServerEvent(
  event: AnalyticsEvent,
  distinctId: string,
  properties: Record<string, unknown>,
) {
  const client = getPosthogClient();
  if (!client) {
    return;
  }

  client.capture({
    event,
    distinctId,
    properties,
  });
}
