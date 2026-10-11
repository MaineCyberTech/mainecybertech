"use client";

import Script from "next/script";
import { useConsent } from "./ConsentProvider";

interface AnalyticsScriptsProps {
  gaId: string;
  tawktoId: string;
  nonce: string;
}

/**
 * PRIV-P2-001: Google Analytics and the Tawk.to widget are injected only after
 * the visitor has explicitly accepted them. Nothing renders before the stored
 * choice is read (see ConsentProvider), so no third-party request is made on
 * page load without consent.
 */
export default function AnalyticsScripts({ gaId, tawktoId, nonce }: AnalyticsScriptsProps) {
  const { choice } = useConsent();

  if (choice !== "granted") return null;

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
            nonce={nonce}
          />
          <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
          </Script>
        </>
      )}

      {tawktoId && (
        <Script
          src={`https://embed.tawk.to/${tawktoId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
          nonce={nonce}
        />
      )}
    </>
  );
}
