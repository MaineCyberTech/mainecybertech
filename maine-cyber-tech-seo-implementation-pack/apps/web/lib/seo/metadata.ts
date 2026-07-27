import type { Metadata } from "next";
import { siteConfig } from "./site";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.defaultOgImage,
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const url = new URL(path, siteConfig.url).toString();
  const absoluteImage = image.startsWith("http")
    ? image
    : new URL(image, siteConfig.url).toString();

  return {
    metadataBase: new URL(siteConfig.url),
    title: title
      ? `${title} | ${siteConfig.name}`
      : `${siteConfig.name} | Managed IT, Cybersecurity & Business Technology Support`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title: title ?? siteConfig.name,
      description,
      images: [
        {
          url: absoluteImage,
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title ?? siteConfig.name,
      description,
      images: [absoluteImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
