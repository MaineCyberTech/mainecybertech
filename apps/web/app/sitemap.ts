import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";
import { serviceSeo } from "@/lib/seo/services";
import { blogSeoBacklog } from "@/lib/seo/blog";

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
      url: `${siteConfig.url}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const serviceRoutes: MetadataRoute.Sitemap = serviceSeo.map((service) => ({
    url: `${siteConfig.url}${service.canonicalPath}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogSeoBacklog.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...coreRoutes, ...serviceRoutes, ...blogRoutes];
}
