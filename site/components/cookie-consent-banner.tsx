"use client";

import { useConsent } from "@/components/providers/consent-provider";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
  const { consent, setConsentValue } = useConsent();

  if (consent !== "unknown") {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-[#091120]/95 p-5 shadow-panel backdrop-blur-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-base font-semibold text-white">
            Cookies and analytics
          </p>
          <p className="mt-2 text-sm leading-7 text-white/65">
            Tipspay uses essential cookies for session security and optional
            analytics for launch insights. Analytics will only start after your
            approval.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-cyan-200">
            <a href="/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white">
              Terms
            </a>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConsentValue("declined")}
          >
            Decline
          </Button>
          <Button type="button" onClick={() => setConsentValue("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
