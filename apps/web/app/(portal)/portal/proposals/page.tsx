import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposals - Portal - Maine CyberTech" };

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function statusClass(status: string): string {
  const base =
    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";
  switch (status) {
    case "draft":
      return `${base} border-slate-500/25 bg-slate-500/10 text-slate-300`;
    case "sent":
      return `${base} border-amber-500/25 bg-amber-500/10 text-amber-300`;
    case "approved":
      return `${base} border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
    case "rejected":
      return `${base} border-red-500/25 bg-red-500/10 text-red-300`;
    case "expired":
      return `${base} border-slate-500/25 bg-slate-500/10 text-slate-300`;
    default:
      return `${base} border-white/10 bg-white/5 text-slate-300`;
  }
}

function formatRelative(value?: string | null): string {
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

export default async function PortalProposalsPage() {
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Proposals" }]} />
        <PortalSubnav current="proposals" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          Access restricted. Please contact your administrator.
        </div>
      </div>
    );
  }

  const api = getApiClient();
  let proposals: Array<{
    id: string;
    title: string;
    status: string;
    grand_total: number;
    created_at: string;
    valid_until: string | null;
  }> = [];

  try {
    const result = await api.proposals.list({ organizationId: membership.organization_id });
    proposals = result.items as typeof proposals;
  } catch {
    // Gracefully degrade
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal" }, { label: "Proposals" }]} />
      <PortalSubnav current="proposals" />
      <h1 className="cyber-heading text-2xl">Proposals</h1>
      <p className="text-sm text-slate-400">{proposals.length} proposals available.</p>

      {proposals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {proposals.map((proposal) => (
            <Link
              key={proposal.id}
              href={`/portal/proposals/${proposal.id}`}
              className="cyber-panel block p-5 transition hover:border-emerald-500/30 hover:bg-[#0A1118]/80"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-50">{proposal.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {fmtCurrency(proposal.grand_total ?? 0)} total • Created{" "}
                    {formatRelative(proposal.created_at)}
                  </p>
                </div>
                <span className={statusClass(proposal.status)}>{proposal.status}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-400">
                <span>
                  Valid until:{" "}
                  {proposal.valid_until
                    ? new Date(proposal.valid_until).toISOString().slice(0, 10)
                    : "—"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📄"
          title="No proposals yet"
          description="Proposals sent to your organization will appear here."
        />
      )}
    </div>
  );
}
