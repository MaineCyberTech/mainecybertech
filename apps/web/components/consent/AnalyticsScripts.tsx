"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "./ConsentProvider";

interface AnalyticsScriptsProps {
  gaId: string;
  tawktoId: string;
  nonce: string;
}

/**
 * AN-P3-001: Google Consent Mode v2 default — deny everything that is not
 * strictly necessary. The banner only offers analytics/chat (no ads), so the
 * ad_* signals stay denied permanently and analytics_storage follows the
 * visitor's choice. The signals are emitted before `gtag('config', ...)` so GA
 * never receives a hit with storage enabled before the choice is applied.
 */
const CONSENT_MODE_DENIED = `ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied'`;

/**
 * Withdrawal signal (AN-P3-001): removing a loaded <Script> tag does not unload
 * the third party, so when a visitor changes a stored grant to "denied" the
 * update is pushed through Consent Mode instead. `window.gtag` only exists once
 * the GA loader ran, which is exactly the case that needs the update.
 */
function signalConsentWithdrawal(): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
  });
}

/**
 * PRIV-P2-001: Google Analytics and the Tawk.to widget are injected only after
 * the visitor has explicitly accepted them. Nothing renders before the stored
 * choice is read (see ConsentProvider), so no third-party request is made on
 * page load without consent.
 */
export default function AnalyticsScripts({ gaId, tawktoId, nonce }: AnalyticsScriptsProps) {
  const { choice } = useConsent();

  useEffect(() => {
    if (choice === "denied") signalConsentWithdrawal();
  }, [choice]);

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
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('consent', 'default', {${CONSENT_MODE_DENIED}}); gtag('consent', 'update', {analytics_storage: 'granted'}); gtag('js', new Date()); gtag('config', '${gaId}');`}
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
