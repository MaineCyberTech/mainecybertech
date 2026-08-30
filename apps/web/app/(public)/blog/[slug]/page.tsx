import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, blogPosts } from "@/lib/seo/blog-posts";
import { siteConfig } from "@/lib/seo/site";
import { buildMetadata } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { buildArticleSchema } from "@/lib/seo/schema";
import { serviceSeo } from "@/lib/seo/services";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };

  return buildMetadata({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${slug}`,
    ogType: "article",
    publishedTime: post.datePublished,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: siteConfig.url },
          { name: "Blog", url: `${siteConfig.url}/blog` },
          { name: post.title, url: `${siteConfig.url}/blog/${slug}` },
        ]}
      />
      <JsonLd
        data={
          buildArticleSchema({
            title: post.title,
            description: post.metaDescription,
            slug,
            datePublished: post.datePublished,
          }) as Record<string, unknown>
        }
      />

      <article className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="mb-8 inline-block text-sm font-semibold uppercase tracking-widest text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            ⯇ Back to Blog
          </Link>

          <div className="mb-3">
            <span className="rounded bg-emerald-600/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {post.category}
            </span>
            <span className="ml-3 text-sm text-slate-500">{post.datePublished}</span>
          </div>

          <h1 className="font-orbitron text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">{post.metaDescription}</p>

          <div className="mt-10 space-y-8">
            {post.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="font-orbitron mb-3 text-xl font-bold text-slate-100">
                  {section.heading}
                </h2>
                <ul className="space-y-2 pl-5 text-slate-400">
                  {section.items.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {post.faq && post.faq.length > 0 && (
            <div className="mt-12 border-t border-white/10 pt-10">
              <h2 className="font-orbitron text-2xl font-bold text-slate-100">
                Frequently Asked <span className="text-emerald-500">Questions</span>
              </h2>
              <div className="mt-6 space-y-5">
                {post.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-5 backdrop-blur-sm"
                  >
                    <h3 className="font-orbitron text-base font-bold text-slate-100">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 rounded-lg border border-emerald-600/20 bg-[rgba(18,30,45,0.75)] p-6 backdrop-blur-md">
            <h2 className="font-orbitron text-lg font-bold text-slate-100">Need help?</h2>
            <p className="mt-2 text-slate-400">{post.cta}</p>
            <Link
              href="/contact"
              className="font-orbitron mt-4 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Contact Us
            </Link>
          </div>

          {post.relatedServices.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-8">
              <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-slate-400">
                Related Services
              </h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {post.relatedServices.map((serviceSlug) => {
                  const service = serviceSeo.find((s) => s.slug === serviceSlug);
                  if (!service) return null;
                  return (
                    <Link
                      key={serviceSlug}
                      href={service.canonicalPath}
                      className="rounded bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-emerald-600/20 hover:text-emerald-400"
                    >
                      {service.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
}
