import Script from "next/script";
import type { Metadata } from "next";
import MarketingHeader from "../../components/marketing/MarketingHeader";
import ParticleBackground from "../../components/marketing/ParticleBackground";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "Maine Cyber Technology",
};
const TAWKTO_ID = process.env.NEXT_PUBLIC_TAWKTO_ID;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${GA_ID}');`}
          </Script>
        </>
      )}

      {TAWKTO_ID && (
        <Script
          src={`https://embed.tawk.to/${TAWKTO_ID}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}

      <ParticleBackground />
      <MarketingHeader />
      <main>{children}</main>
    </>
  );
}
