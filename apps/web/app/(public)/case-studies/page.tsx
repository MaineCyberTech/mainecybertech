import { getApprovedCaseStudies } from "@/lib/catalog/v5-loaders";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Case Studies",
  description: "Real results from Maine businesses and organizations we have helped.",
  path: "/case-studies",
});

export default function CaseStudiesIndexPage() {
  const caseStudies = getApprovedCaseStudies();

  return (
    <section className="min-h-screen px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-4xl">
        <nav className="mb-8 text-sm font-semibold uppercase tracking-widest text-slate-500">
          <Link
            href="/"
            className="text-emerald-500 no-underline transition hover:text-emerald-400"
          >
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-300">Case Studies</span>
        </nav>

        <h1 className="font-orbitron mb-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Case{" "}
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
            Studies
          </span>
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-slate-400">
          Real results from Maine businesses and organizations we have helped.
        </p>

        {caseStudies.length === 0 ? (
          <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-12 text-center backdrop-blur-sm">
            <h2 className="font-orbitron mb-4 text-xl font-bold uppercase tracking-wider text-slate-50">
              Coming Soon
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-400">
              We are currently collecting and approving case studies with our clients. Check back
              soon to see how Maine CyberTech has helped local businesses improve their technology,
              security, and operations.
            </p>
            <Link
              href="/contact"
              className="font-orbitron mt-8 inline-block rounded border-2 border-emerald-600 bg-emerald-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)]"
            >
              Ask About Our Work
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((cs) => (
              <Link
                key={cs.id}
                href={`/case-studies/${cs.slug}`}
                className="glass-card glass-card-hover group flex flex-col p-8 no-underline sm:p-10"
              >
                <span className="mb-3 inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {cs.organization}
                </span>
                <h3 className="font-orbitron mb-3 text-lg font-bold uppercase tracking-wider text-slate-50">
                  {cs.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">{cs.summary}</p>
                <span className="mt-auto text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
                  Read Case Study →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
