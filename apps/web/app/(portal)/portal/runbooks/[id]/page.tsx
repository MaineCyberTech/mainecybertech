import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Runbook - Portal - Maine CyberTech" };

type Props = { params: Promise<{ id: string }> };

type Runbook = {
  id: string;
  title: string;
  category: string | null;
  content: string | null;
  version: string;
  status: string;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

export default async function PortalRunbookDetailPage({ params }: Props) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const { id } = await params;
  const api = getApiClient();

  let runbook: Runbook | null = null;
  try {
    runbook = (await withRetry(() => api.final.runbooks.get(id))) as unknown as Runbook;
  } catch {
    runbook = null;
  }

  if (!runbook) notFound();

  return (
    <div className="space-y-6" role="region" aria-label="Runbook">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Runbooks", href: "/portal/runbooks" },
          { label: runbook.title },
        ]}
      />
      <PortalSubnav current="runbooks" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{runbook.title}</h1>
          {runbook.category ? (
            <p className="mt-1 text-sm text-slate-400">Category: {runbook.category}</p>
          ) : null}
        </div>
        <StatusPill status={runbook.status || "unknown"} />
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Version</dt>
          <dd className="mt-1 text-slate-200">{runbook.version || "1.0"}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Last reviewed</dt>
          <dd className="mt-1 text-slate-200">{formatDate(runbook.last_reviewed_at)}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Next review</dt>
          <dd className="mt-1 text-slate-200">{formatDate(runbook.next_review_at)}</dd>
        </div>
      </dl>

      <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
          Procedure
        </h2>
        {runbook.content ? (
          <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200">
            {runbook.content}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No procedure content has been published.</p>
        )}
      </section>

      <Link href="/portal/runbooks" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Back to runbooks
      </Link>
    </div>
  );
}
