import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";
import { blogPosts } from "@/lib/seo/blog-posts";

/**
 * Sitemap is intentionally limited to the homepage and the blog, matching the
 * `robots.ts` policy (everything else is disallowed from crawling). Listing
 * disallowed URLs here would only advertise pages we do not want indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...blogRoutes];
}
