"use client";

import type { ReactNode } from "react";

import { AnalyticsProvider } from "@/components/providers/analytics-provider";
import { ConsentProvider } from "@/components/providers/consent-provider";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConsentProvider>
      <AnalyticsProvider />
      {children}
      <CookieConsentBanner />
    </ConsentProvider>
  );
}
