import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { withRetry } from "@/lib/retry";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";
import { formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `QBR (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

type QbrData = {
  id: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  summary: string | null;
  report_data: Record<string, unknown> | null;
  generated_at?: string | null;
  created_at: string;
};

function count(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export default async function PortalQbrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  let report: QbrData | null = null;
  try {
    report = (await withRetry(() => api.qbr.get(id))) as unknown as QbrData;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  if (!report) notFound();

  const data = object(report.report_data);
  const tickets = object(data.tickets);
  const projects = object(data.projects);
  const findings = object(data.findings);
  const assets = object(data.assets);
  const security = object(data.securityPosture);

  const stats = [
    { label: "Tickets", value: count(tickets.total), detail: `${count(tickets.open)} open` },
    {
      label: "Projects",
      value: count(projects.total),
      detail: `${count(projects.active)} active`,
    },
    {
      label: "Findings",
      value: count(findings.p0) + count(findings.p1) + count(findings.p2) + count(findings.p3),
      detail: `${count(findings.open)} open`,
    },
    {
      label: "Assets",
      value: count(assets.total),
      detail: `${count(assets.expiringWarranties)} warranty expiring`,
    },
    {
      label: "Monitored domains",
      value: count(security.monitoredDomains),
      detail: `${count(security.alertCount)} alerts`,
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "QBR Reports", href: "/portal/qbr" },
          { label: report.title },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{report.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {report.period_start ? formatDate(report.period_start) : "—"} to{" "}
            {report.period_end ? formatDate(report.period_end) : "—"}
          </p>
        </div>
        <StatusPill status={report.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <p className="text-2xl font-bold text-slate-50">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className="mt-1 text-[11px] text-slate-500">{stat.detail}</p>
          </div>
        ))}
      </div>

      {report.summary ? (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Executive summary</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {report.summary}
          </p>
        </section>
      ) : null}

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Report details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Generated</dt>
            <dd className="mt-1 text-slate-200">
              {formatDateTime(report.generated_at ?? report.created_at)}
            </dd>
          </div>
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-500">Status</dt>
            <dd className="mt-1 capitalize text-slate-200">{report.status.replace(/_/g, " ")}</dd>
          </div>
        </dl>
      </section>

      <Link href="/portal/qbr" className="cyber-button-secondary">
        Back to QBR reports
      </Link>
    </div>
  );
}
