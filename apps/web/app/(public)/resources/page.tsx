import { getLeadMagnets } from "@/lib/catalog/v5-loaders";
import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Free IT Checklists & Resources",
  description:
    "Download practical checklists for cybersecurity, IT setup, offboarding, website health, and more — free from Maine CyberTech.",
  path: "/resources",
});

export default function ResourcesIndexPage() {
  const magnets = getLeadMagnets();

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
          <span className="text-slate-300">Resources</span>
        </nav>

        <h1 className="font-orbitron mb-4 text-4xl font-bold uppercase tracking-wider text-slate-50 sm:text-5xl">
          Free{" "}
          <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(5,150,105,0.5)]">
            Resources
          </span>
        </h1>
        <p className="mb-12 text-lg leading-relaxed text-slate-400">
          Practical checklists and guides to help you stay organized, secure, and prepared. No email
          required — just pick what you need.
        </p>

        {magnets.length === 0 ? (
          <div className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-12 text-center backdrop-blur-sm">
            <p className="text-slate-400">No resources available yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {magnets.map((magnet) => (
              <Link
                key={magnet.id}
                href={`/resources/${magnet.slug}`}
                className="glass-card glass-card-hover group flex flex-col p-8 no-underline sm:p-10"
              >
                <span className="mb-3 inline-block w-fit rounded-full border border-emerald-600/20 bg-emerald-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Checklist
                </span>
                <h3 className="font-orbitron mb-3 text-lg font-bold uppercase tracking-wider text-slate-50">
                  {magnet.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">
                  {magnet.description ||
                    `A structured ${magnet.title.toLowerCase()} covering essential steps and best practices.`}
                </p>
                <span className="mt-auto text-xs font-bold uppercase tracking-widest text-emerald-500 transition-all group-hover:translate-x-1">
                  View Checklist →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
