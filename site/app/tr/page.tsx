import type { Metadata } from "next";
import Script from "next/script";

import { TipspayReservationLanding } from "@/components/landing/tipspay-reservation-landing";
import { isReservationEnabled } from "@/lib/feature-flag";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Tipspay Kullanici Adi Rezervasyonu | Guvenli OTP Erisimi",
    description:
      "Tipspay @tips kullanici adinizi OTP dogrulamasi ile rezerve edin ve TipsWallet erisimini guvenli sekilde acin.",
    alternates: {
      canonical: "https://tipspay.org/tr",
      languages: {
        en: "https://tipspay.org",
        tr: "https://tipspay.org/tr",
      },
    },
  };
}

export default async function TurkishPage() {
  const reservationEnabled = await isReservationEnabled();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tipspay Kullanici Adi Rezervasyonu",
    url: "https://tipspay.org/tr",
    description:
      "Tipspay icin OTP tabanli kullanici adi rezervasyonu ve guvenli cuzdan girisi.",
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
        id="tipspay-jsonld-tr"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TipspayReservationLanding reservationEnabled={reservationEnabled} />
    </>
  );
}
