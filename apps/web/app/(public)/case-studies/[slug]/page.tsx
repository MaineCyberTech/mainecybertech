import { getCaseStudyBySlug, getApprovedCaseStudies } from "@/lib/catalog/v5-loaders";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getApprovedCaseStudies().map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cs = getCaseStudyBySlug(slug);
  if (!cs) return { title: "Case Study Not Found" };

  return buildMetadata({
    title: cs.title,
    description: cs.summary,
    path: `/case-studies/${slug}`,
  });
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cs = getCaseStudyBySlug(slug);
  if (!cs) notFound();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/case-studies"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Case Studies
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">{cs.title}</span>
        </nav>

        <div className="mb-8">
          <span className="mb-4 inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {cs.organization}
          </span>
          <h1 className="font-orbitron mt-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
            {cs.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-400">{cs.summary}</p>
        </div>

        <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-8 backdrop-blur-sm">
          <div className="prose prose-invert max-w-none">
            {cs.body.split("\n").map((paragraph: string, i: number) =>
              paragraph.trim() ? (
                <p key={i} className="mb-4 leading-relaxed text-slate-300">
                  {paragraph}
                </p>
              ) : null,
            )}
          </div>
        </div>

        {cs.outcome && (
          <div className="mt-8 rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-6 backdrop-blur-sm">
            <h2 className="font-orbitron mb-3 text-lg font-bold uppercase tracking-wider text-emerald-400">
              Outcome
            </h2>
            <p className="leading-relaxed text-slate-300">{cs.outcome}</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/contact"
            className="font-orbitron inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-10 py-4 text-sm font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
          >
            Let&rsquo;s Talk About Your Project
          </Link>
        </div>
      </div>
    </section>
  );
}
