import { headers } from "next/headers";
import type { Metadata } from "next";
import MarketingHeader from "../../components/marketing/MarketingHeader";
import MarketingFooter from "../../components/marketing/MarketingFooter";
import ParticleBackground from "../../components/marketing/ParticleBackground";
import LocalBusinessJsonLd from "../../components/seo/LocalBusinessJsonLd";
import AnalyticsScripts from "../../components/consent/AnalyticsScripts";
import ConsentBanner from "../../components/consent/ConsentBanner";
import ConsentProvider from "../../components/consent/ConsentProvider";
import { siteConfig } from "../../lib/seo/site";
import { getClientEnv } from "../../lib/env";

const GA_ID = getClientEnv().NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Managed IT, Cybersecurity & Business Technology Support`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // No `alternates.canonical` here: a layout-level canonical is inherited by
  // every child, which made pages that only set a title (contact, privacy,
  // terms, status, upload) declare themselves duplicates of the homepage.
  // Pages set their own canonical via buildMetadata().
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
const TAWKTO_ID = getClientEnv().NEXT_PUBLIC_TAWKTO_ID;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <ConsentProvider>
      {/* PRIV-P2-001: GA/Tawk.to are gated on an explicit, persisted choice. */}
      <AnalyticsScripts gaId={GA_ID} tawktoId={TAWKTO_ID} nonce={nonce} />

      <LocalBusinessJsonLd />
      <ParticleBackground />
      <MarketingHeader />
      <main id="main-content">{children}</main>
      <MarketingFooter />
      <ConsentBanner />
    </ConsentProvider>
  );
}
