"use client";

import { useEffect, useRef } from "react";

import { useConsent } from "@/components/providers/consent-provider";

declare global {
  interface Window {
    __tipspayAnalyticsReady?: boolean;
  }
}

export function AnalyticsProvider() {
  const { consent } = useConsent();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (consent !== "accepted" || initializedRef.current) {
      return;
    }

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey || !posthogHost) {
      initializedRef.current = true;
      return;
    }

    void import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(posthogKey, {
          api_host: posthogHost,
          persistence: "localStorage",
          capture_pageview: true,
          loaded: () => {
            window.__tipspayAnalyticsReady = true;
          },
        });
        initializedRef.current = true;
      })
      .catch(() => {
        initializedRef.current = true;
      });
  }, [consent]);

  return null;
}
