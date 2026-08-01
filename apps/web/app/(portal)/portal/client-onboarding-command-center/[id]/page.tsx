import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Onboarding Detail - Portal - Maine CyberTech" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function rel(value?: string | null) {
  if (!value) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    discovery: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    m365_setup: "border-purple-500/25 bg-purple-500/10 text-purple-300",
    access_collection: "border-indigo-500/25 bg-indigo-500/10 text-indigo-300",
    network_baseline: "border-teal-500/25 bg-teal-500/10 text-teal-300",
    documentation: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
    security_baseline: "border-red-500/25 bg-red-500/10 text-red-300",
    support_handoff: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    on_hold: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[status] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function riskBadge(risk: string) {
  const styles: Record<string, string> = {
    low: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    medium: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    high: "border-orange-500/25 bg-orange-500/10 text-orange-300",
    critical: "border-red-500/25 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${styles[risk] || "border-white/10 bg-white/5 text-slate-300"}`}
    >
      {risk}
    </span>
  );
}

function phaseCard({
  title,
  status,
  items,
}: {
  title: string;
  status: string;
  items: Array<{
    item_key: string;
    label: string;
    is_required: boolean;
    is_completed: boolean;
    notes: string | null;
    completed_by: string | null;
    completed_at: string | null;
  }>;
}) {
  const statusStyles: Record<string, string> = {
    not_started: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    skipped: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;

  return (
    <section className="cyber-panel">
      <div className="flex items-center justify-between gap-3">
        <h2 className="cyber-heading text-lg">{title}</h2>
        <span
          className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusStyles[status] || "border-white/10 bg-white/5 text-slate-300"}`}
        >
          {status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-2 text-sm text-slate-400">
        {completedCount} / {totalCount} items completed
      </div>
      <div className="mt-4 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.item_key}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0A1118]/60 p-3"
            >
              <input
                type="checkbox"
                checked={item.is_completed}
                disabled
                aria-label={item.label ?? "Onboarding item"}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-medium ${item.is_completed ? "text-slate-400 line-through" : "text-slate-50"}`}
                >
                  {item.label}
                  {item.is_required && (
                    <span className="ml-2 text-[10px] text-red-400">(required)</span>
                  )}
                </p>
                {item.notes && <p className="mt-1 text-xs text-slate-400">{item.notes}</p>}
                {item.completed_at && (
                  <p className="mt-1 text-xs text-slate-500">Completed {rel(item.completed_at)}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon="📋"
            title="No checklist items"
            description="Checklist items will appear here."
          />
        )}
      </div>
    </section>
  );
}

export default async function ClientOnboardingDetailPage({ params }: Props) {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();
  const { id } = await params;
  const api = getApiClient();

  let record: {
    id: string;
    client_name: string;
    client_domain: string | null;
    client_contact_email: string | null;
    client_contact_phone: string | null;
    onboarding_lead_id: string | null;
    status: string;
    phase: string;
    risk_level: string;
    discovery_notes: string | null;
    m365_setup_status: string;
    m365_tenant_id: string | null;
    m365_licenses: Record<string, unknown>;
    access_collection_status: string;
    access_credentials: Record<string, unknown>;
    network_baseline_status: string;
    network_diagram_url: string | null;
    network_scan_results: Record<string, unknown>;
    documentation_status: string;
    documentation_url: string | null;
    security_baseline_status: string;
    security_baseline_score: number | null;
    security_findings: unknown[];
    support_handoff_status: string;
    support_handoff_notes: string | null;
    handoff_completed_at: string | null;
    next_review_at: string | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  } | null = null;

  let checklistItems: Array<{
    id: string;
    phase: string;
    item_key: string;
    label: string;
    description: string | null;
    is_required: boolean;
    is_completed: boolean;
    completed_by: string | null;
    completed_at: string | null;
    notes: string | null;
  }> = [];

  try {
    const [recordResult, checklistResult] = await Promise.allSettled([
      api.clientOnboarding.get(id),
      api.clientOnboarding.listChecklistItems(id),
    ]);

    if (recordResult.status === "fulfilled" && recordResult.value) {
      record = recordResult.value;
    }
    if (checklistResult.status === "fulfilled" && checklistResult.value) {
      checklistItems = checklistResult.value;
    }
  } catch {
    // Gracefully handle errors
  }

  if (!record) {
    notFound();
  }

  const phases = [
    {
      key: "discovery",
      title: "Discovery",
      status:
        record.status === "discovery"
          ? "in_progress"
          : [
                "m365_setup",
                "access_collection",
                "network_baseline",
                "documentation",
                "security_baseline",
                "support_handoff",
                "completed",
              ].includes(record.phase)
            ? "completed"
            : "not_started",
    },
    { key: "m365_setup", title: "M365 Setup", status: record.m365_setup_status },
    {
      key: "access_collection",
      title: "Access Collection",
      status: record.access_collection_status,
    },
    { key: "network_baseline", title: "Network Baseline", status: record.network_baseline_status },
    { key: "documentation", title: "Documentation", status: record.documentation_status },
    {
      key: "security_baseline",
      title: "Security Baseline",
      status: record.security_baseline_status,
    },
    { key: "support_handoff", title: "Support Handoff", status: record.support_handoff_status },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: "Portal", href: "/portal" },
              { label: "Client Onboarding", href: "/portal/client-onboarding-command-center" },
              { label: record.client_name },
            ]}
          />
          <h1 className="cyber-heading mt-2 text-2xl">{record.client_name}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {record.client_domain && <span>{record.client_domain} • </span>}
            {record.client_contact_email && <span>{record.client_contact_email} • </span>}
            Phase: {record.phase.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {statusBadge(record.status)}
          {riskBadge(record.risk_level)}
          {record.next_review_at && (
            <span className="inline-flex min-h-8 items-center rounded-full border border-slate-500/25 bg-slate-500/10 px-3 py-1 text-[11px] font-semibold text-slate-300">
              Review: {rel(record.next_review_at)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {phases.map((p) => {
            const items = checklistItems.filter((i) => i.phase === p.key);
            return phaseCard({
              title: p.title,
              status: p.status,
              items,
            });
          })}
        </div>

        <div className="space-y-4">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Client Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-slate-400">Domain</dt>
                <dd className="text-slate-50">{record.client_domain || "—"}</dd>
                <dt className="text-slate-400">Contact Email</dt>
                <dd className="text-slate-50">{record.client_contact_email || "—"}</dd>
                <dt className="text-slate-400">Contact Phone</dt>
                <dd className="text-slate-50">{record.client_contact_phone || "—"}</dd>
                <dt className="text-slate-400">Onboarding Lead</dt>
                <dd className="text-slate-50">{record.onboarding_lead_id || "—"}</dd>
                <dt className="text-slate-400">Started</dt>
                <dd className="text-slate-50">{rel(record.started_at)}</dd>
                {record.completed_at && (
                  <>
                    <dt className="text-slate-400">Completed</dt>
                    <dd className="text-slate-50">{rel(record.completed_at)}</dd>
                  </>
                )}
                <dt className="text-slate-400">Next Review</dt>
                <dd className="text-slate-50">
                  {record.next_review_at ? rel(record.next_review_at) : "—"}
                </dd>
              </div>
            </dl>
          </section>

          {record.discovery_notes && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Discovery Notes</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
                {record.discovery_notes}
              </p>
            </section>
          )}

          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">M365 Details</h2>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 space-y-3 text-sm">
              <dt className="text-slate-400">Setup Status</dt>
              <dd className="text-slate-50">{record.m365_setup_status}</dd>
              <dt className="text-slate-400">Tenant ID</dt>
              <dd className="font-mono text-xs text-slate-50">{record.m365_tenant_id || "—"}</dd>
              <dt className="text-slate-400">Licenses</dt>
              <dd className="text-slate-50">
                {Object.keys(record.m365_licenses).length > 0 ? (
                  <pre className="max-h-32 overflow-auto rounded bg-slate-900/50 p-2 text-xs">
                    {JSON.stringify(record.m365_licenses, null, 2)}
                  </pre>
                ) : (
                  "—"
                )}
              </dd>
            </dl>
          </section>

          {record.security_baseline_score !== null && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Security Baseline Score</h2>
              <div className="font-orbitron mt-4 text-3xl text-emerald-400">
                {record.security_baseline_score}/100
              </div>
              {record.security_findings.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-400">Findings:</p>
                  <ul className="space-y-1">
                    {record.security_findings.map((f, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        • {JSON.stringify(f)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {record.support_handoff_notes && (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Support Handoff Notes</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
                {record.support_handoff_notes}
              </p>
              {record.handoff_completed_at && (
                <p className="mt-2 text-xs text-slate-400">
                  Handoff completed {rel(record.handoff_completed_at)}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
