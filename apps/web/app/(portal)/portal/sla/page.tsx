import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "SLA Metrics - Portal - Maine CyberTech" };

export default async function SlaPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let summary: Record<string, unknown> = {};
  let byMetric: Array<Record<string, unknown>> = [];
  try {
    const r = await api.sla.metrics({ organizationId: orgId });
    summary = ((r as Record<string, unknown>).summary as Record<string, unknown>) ?? {};
    byMetric = ((r as Record<string, unknown>).byMetric as Array<Record<string, unknown>>) ?? [];
  } catch {}

  const total = Number(summary.total ?? 0);
  const breached = Number(summary.breached ?? 0);
  const breachedRate = Number(summary.breachedRate ?? 0);
  const resolved = Number(summary.resolved ?? 0);

  return (
    <div className="space-y-6" role="region" aria-label="SLA Metrics">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "SLA Metrics" }]}
      />
      <PortalSubnav current="sla" />
      <h1 className="text-2xl font-semibold text-slate-50">SLA Metrics</h1>

      <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
        <h2 className="text-sm font-medium text-slate-300">Summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-bold text-slate-50">{total}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{breached}</p>
            <p className="text-xs text-slate-400">Breached</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">{Math.round(breachedRate * 100)}%</p>
            <p className="text-xs text-slate-400">Breach Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{resolved}</p>
            <p className="text-xs text-slate-400">Resolved</p>
          </div>
        </div>
      </div>

      {byMetric.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
          <h2 className="text-sm font-medium text-slate-300">By Metric</h2>
          <div className="mt-3 space-y-3">
            {byMetric.map((m, idx) => (
              <div
                key={String(m.metric ?? idx)}
                className="flex items-center justify-between text-xs text-slate-400"
              >
                <span className="font-medium text-slate-50">{String(m.metric ?? "Unknown")}</span>
                <div className="flex gap-4">
                  <span>Total: {String(m.total ?? 0)}</span>
                  <span>Breached: {String(m.breached ?? 0)}</span>
                  <span>Avg: {String(m.avgMinutes ?? 0)} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {byMetric.length === 0 && total === 0 && (
        <p className="text-sm text-slate-400">No SLA metrics available.</p>
      )}

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
