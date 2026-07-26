import Link from "next/link";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/seo/blog-posts";
import { siteConfig } from "@/lib/seo/site";
import { buildMetadata } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { buildOrganizationSchema } from "@/lib/seo/schema";
import { serviceSeo } from "@/lib/seo/services";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Practical IT, cybersecurity, and technology guides for Maine small businesses, campgrounds, and local organizations.",
  path: "/blog",
});

const categoryLabels: Record<string, string> = {
  "Managed IT": "Managed IT",
  Cybersecurity: "Cybersecurity",
  "Microsoft 365": "Microsoft 365",
  Networking: "Networking",
  "Security Systems": "Security Systems",
  "Cloud Backup": "Cloud Backup",
  "Local Business Technology": "Local Business Technology",
};

export default function BlogPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
        ]}
      />
      <JsonLd data={buildOrganizationSchema() as Record<string, unknown>} />

      <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/"
            className="mb-8 inline-block text-sm font-semibold uppercase tracking-widest text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            ⯇ Back to Home
          </Link>

          <div className="mb-16 text-center">
            <h1 className="font-orbitron text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
              Maine CyberTech <span className="text-emerald-500">Blog</span>
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Practical IT, cybersecurity, and technology guides for Maine small businesses,
              campgrounds, and local organizations.
            </p>
          </div>

          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-lg border border-emerald-600/20 bg-[rgba(18,30,45,0.75)] p-6 shadow-[0_0_30px_rgba(5,150,105,0.05)] backdrop-blur-md transition hover:border-emerald-600/40 sm:p-8"
              >
                <div className="mb-2 flex items-center gap-3">
                  <span className="rounded bg-emerald-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {categoryLabels[post.category] ?? post.category}
                  </span>
                  <span className="text-xs text-slate-500">{post.datePublished}</span>
                </div>
                <h2 className="font-orbitron text-xl font-bold text-slate-50">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="no-underline transition hover:text-emerald-400"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-slate-400">{post.metaDescription}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.relatedServices.map((serviceSlug) => {
                    const service = serviceSeo.find((s) => s.slug === serviceSlug);
                    if (!service) return null;
                    return (
                      <Link
                        key={serviceSlug}
                        href={service.canonicalPath}
                        className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 transition hover:bg-emerald-600/20 hover:text-emerald-400"
                      >
                        {service.title}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
