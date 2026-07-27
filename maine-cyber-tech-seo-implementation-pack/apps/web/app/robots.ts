import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/portal",
          "/login",
          "/signup",
          "/password-reset",
          "/forgot-password",
          "/api",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
