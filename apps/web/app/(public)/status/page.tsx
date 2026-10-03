import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "System Status",
  description: "Current operational status of Maine CyberTech services.",
  path: "/status",
});

export default function StatusIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl uppercase tracking-[0.12em] text-slate-50">
        System Status
      </h1>
      <p className="mt-4 text-sm text-slate-400">
        Live component health, active incidents, and scheduled maintenance are published per
        organization. Sign in to the client portal to view the status page for your organization.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded border border-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-500 transition hover:bg-emerald-600/10"
        >
          Sign in
        </Link>
        <Link
          href="/contact"
          className="rounded border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-300 transition hover:bg-white/5"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
