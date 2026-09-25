import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

/**
 * Crawling is intentionally limited to the homepage and the blog for now.
 *
 * `Disallow: /` blocks everything, then the more specific `Allow` rules
 * re-open the homepage (`/$` anchors to the root only) and the blog index +
 * posts (`/blog` prefix). Everything else — services, store, case studies,
 * resources, contact, status, legal, admin, portal, api — is off-limits to
 * compliant crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/$", "/blog", "/blog/"],
        disallow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
