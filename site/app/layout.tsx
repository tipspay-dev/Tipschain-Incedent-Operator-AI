import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://tipspay.org"),
  title: "Tipspay",
  description: "Tipspay username reservation, wallet onboarding, and secure access layer for Tipschain.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
