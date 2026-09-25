import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import StatusPill from "@/components/StatusPill";
import { SeverityPill } from "@/components/admin/SeverityPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finding - Portal - Maine CyberTech" };

type Props = { params: Promise<{ id: string }> };

type FindingDetail = {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  source: string;
  finding_category: string | null;
  remediation_plan: string | null;
  remediation_deadline: string | null;
  verification_steps: string | null;
  verified_at: string | null;
  affected_systems: string | null;
  controls_impacted: string | null;
  resolved_at: string | null;
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

export default async function PortalFindingDetailPage({ params }: Props) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const { id } = await params;
  const api = getApiClient();

  let finding: FindingDetail | null = null;
  try {
    finding = (await withRetry(() => api.findings.get(id))) as unknown as FindingDetail;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  if (!finding) notFound();

  return (
    <div className="space-y-6" role="region" aria-label="Finding">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Findings", href: "/portal/findings" },
          { label: finding.title },
        ]}
      />
      <PortalSubnav current="findings" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{finding.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Source: {finding.source}
            {finding.finding_category ? ` • Category: ${finding.finding_category}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeverityPill severity={finding.severity} />
          <StatusPill status={finding.status} />
        </div>
      </div>

      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Remediation due</dt>
          <dd className="mt-1 text-slate-200">{formatDate(finding.remediation_deadline)}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Resolved</dt>
          <dd className="mt-1 text-slate-200">{formatDate(finding.resolved_at)}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <dt className="text-xs uppercase tracking-wide text-slate-500">Verified</dt>
          <dd className="mt-1 text-slate-200">{formatDate(finding.verified_at)}</dd>
        </div>
      </dl>

      {finding.description ? (
        <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {finding.description}
          </p>
        </section>
      ) : null}

      {finding.affected_systems || finding.controls_impacted ? (
        <div className="grid gap-4 md:grid-cols-2">
          {finding.affected_systems ? (
            <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">
                Affected systems
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                {finding.affected_systems}
              </p>
            </section>
          ) : null}
          {finding.controls_impacted ? (
            <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
              <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">
                Controls impacted
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">
                {finding.controls_impacted}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}

      {finding.remediation_plan ? (
        <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Remediation plan</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {finding.remediation_plan}
          </p>
        </section>
      ) : null}

      {finding.verification_steps ? (
        <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
          <h2 className="text-xs uppercase tracking-[0.12em] text-slate-400">Verification steps</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {finding.verification_steps}
          </p>
        </section>
      ) : null}

      <Link href="/portal/findings" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Back to findings
      </Link>
    </div>
  );
}
