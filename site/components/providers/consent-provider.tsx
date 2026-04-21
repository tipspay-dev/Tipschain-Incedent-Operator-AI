"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ConsentValue = "unknown" | "accepted" | "declined";

type ConsentContextValue = {
  consent: ConsentValue;
  setConsentValue: (value: Exclude<ConsentValue, "unknown">) => void;
};

const STORAGE_KEY = "tipspay_cookie_consent";

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentValue>("unknown");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;

    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
      return;
    }

    setConsent("unknown");
  }, []);

  const setConsentValue = useCallback(
    (value: Exclude<ConsentValue, "unknown">) => {
      window.localStorage.setItem(STORAGE_KEY, value);
      setConsent(value);
    },
    [],
  );

  const value = useMemo(
    () => ({ consent, setConsentValue }),
    [consent, setConsentValue],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within ConsentProvider");
  }

  return context;
}
