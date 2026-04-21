import type { Metadata } from "next";
import Script from "next/script";

import { TipspayReservationLanding } from "@/components/landing/tipspay-reservation-landing";
import { isReservationEnabled } from "@/lib/feature-flag";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tipspay Username Reservation | Secure OTP Launch Access",
    description:
      "Reserve your Tipspay @tips username with OTP verification before entering the hosted wallet. Premium launch flow for Tipschain payments and DEX access.",
    keywords: [
      "Tipspay",
      "Tipschain",
      "username reservation",
      "wallet onboarding",
      "OTP authentication",
      "Web3 finance",
      "TipsDEX",
      "TipsWallet",
    ],
    openGraph: {
      title: "Tipspay Username Reservation",
      description:
        "Reserve your Tipspay username, verify with OTP, and enter the wallet launch securely.",
      url: "https://tipspay.org",
      siteName: "Tipspay",
      images: [
        {
          url: "https://tipspay.org/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Tipspay username reservation launch",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "tipspay.org",
      creator: "tipspay.org",
      title: "Tipspay Username Reservation",
      description:
        "Secure reservation-first wallet launch with OTP verification for Tipspay.",
      images: ["https://tipspay.org/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: "https://tipspay.org",
      languages: {
        en: "https://tipspay.org",
        tr: "https://tipspay.org/tr",
      },
    },
  };
}

export default async function Page() {
  const reservationEnabled = await isReservationEnabled();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tipspay Username Reservation",
    url: "https://tipspay.org",
    description:
      "Secure username reservation and OTP-based access flow for Tipspay wallet onboarding on Tipschain.",
    applicationCategory: "FinanceApplication",
    author: {
      "@type": "Organization",
      name: "Tipspay",
      url: "https://tipspay.org",
    },
    publisher: {
      "@type": "Organization",
      name: "Tipspay",
      url: "https://tipspay.org",
    },
  };

  return (
    <>
      <Script
        id="tipspay-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TipspayReservationLanding reservationEnabled={reservationEnabled} />
    </>
  );
}
