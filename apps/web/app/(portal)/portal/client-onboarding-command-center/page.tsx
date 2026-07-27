import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Client Onboarding - Portal - Maine CyberTech" };
export const dynamic = "force-dynamic";

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

export default async function ClientOnboardingPage() {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <Breadcrumbs
          items={[{ label: "Portal", href: "/portal" }, { label: "Client Onboarding" }]}
        />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          Access restricted. Please contact your administrator.
        </div>
      </div>
    );
  }

  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let onboardingRecords: Array<{
    id: string;
    client_name: string;
    client_domain: string | null;
    status: string;
    phase: string;
    risk_level: string;
    onboarding_lead_id: string | null;
    next_review_at: string | null;
    created_at: string;
  }> = [];

  try {
    const result = await api.clientOnboarding.list({ organizationId: orgId, limit: 50, page: 1 });
    onboardingRecords = result?.items ?? [];
  } catch {
    // Gracefully handle errors
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Breadcrumbs
            items={[{ label: "Portal", href: "/portal" }, { label: "Client Onboarding" }]}
          />
          <h1 className="cyber-heading mt-2 text-2xl">Client Onboarding Command Center</h1>
          <p className="mt-1 text-sm text-slate-400">
            Repeatable workspace for client discovery, M365 setup, access collection, network
            baseline, documentation, security baseline, and support handoff.
          </p>
        </div>
        <Link href="/portal/client-onboarding-command-center/new" className="cyber-button">
          New Onboarding
        </Link>
      </div>

      {onboardingRecords.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {onboardingRecords.map((record) => (
            <Link
              key={record.id}
              href={`/portal/client-onboarding-command-center/${record.id}`}
              className="cyber-panel block p-5 transition hover:border-emerald-500/30 hover:bg-[#0A1118]/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-50">{record.client_name}</p>
                  {record.client_domain && (
                    <p className="mt-1 truncate text-xs text-slate-400">{record.client_domain}</p>
                  )}
                </div>
                {statusBadge(record.status)}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {riskBadge(record.risk_level)}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Phase: {record.phase.replace(/_/g, " ")}</span>
                {record.next_review_at && <span>Review: {rel(record.next_review_at)}</span>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-slate-500">
                <span>Created {rel(record.created_at)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🚀"
          title="No onboarding records yet"
          description="Start your first client onboarding engagement to track discovery, M365 setup, access collection, and more."
          actionLabel="Create Onboarding"
          actionHref="/portal/client-onboarding-command-center/new"
        />
      )}
    </div>
  );
}
