import Script from "next/script";
import type { Metadata } from "next";
import MarketingHeader from "../../components/marketing/MarketingHeader";
import ParticleBackground from "../../components/marketing/ParticleBackground";
import LocalBusinessJsonLd from "../../components/seo/LocalBusinessJsonLd";
import { siteConfig } from "../../lib/seo/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Managed IT, Cybersecurity & Business Technology Support`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.defaultOgImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};
const TAWKTO_ID = process.env.NEXT_PUBLIC_TAWKTO_ID;

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocalBusinessJsonLd />
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
