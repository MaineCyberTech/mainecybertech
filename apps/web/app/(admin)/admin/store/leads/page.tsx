import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import EmptyState from "@/components/EmptyState";
import { getApiClient } from "@/lib/api";
import { getLeadScoringData } from "@/lib/catalog/v5-loaders";
import type { StoreLead } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lead Scoring - Store - Admin - Maine CyberTech" };

function bandColor(band: string) {
  const map: Record<string, string> = {
    priority: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    high: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    medium: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    low: "border-slate-500/25 bg-slate-500/10 text-slate-400",
  };
  return map[band] ?? "border-white/10 bg-white/5 text-slate-400";
}

export default async function AdminStoreLeadsPage() {
  await requireAdminAccess();
  const data = getLeadScoringData();

  let leads: StoreLead[] = [];
  let loadFailed = false;
  try {
    leads = await getApiClient().store.listLeads();
  } catch {
    loadFailed = true;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Lead Scoring" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-leads" />}
      title="Lead Scoring Engine"
      description={`${leads.length} scored lead${leads.length === 1 ? "" : "s"} · ${data.rules.length} scoring rules, ${data.scoreBands.length} score bands`}
    >
      {loadFailed && <DataErrorNote what="store leads" />}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Scored Leads</h2>
        {leads.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No scored leads yet"
            description="Leads are created automatically when a quote is submitted from the public store."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-cyber-base/60">
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Band</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-300">Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Signals</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-300">Follow up</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${bandColor(lead.lead_band)}`}
                      >
                        {lead.lead_band}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">
                      {lead.lead_score}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{lead.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {(lead.score_breakdown ?? []).map((b) => b.label).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {lead.follow_up_due_at
                        ? new Date(lead.follow_up_due_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Score Bands</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {data.scoreBands.map((band) => (
            <div key={band.id} className={`rounded-lg border p-4 ${bandColor(band.id)}`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{band.id}</p>
              <p className="mt-1 text-lg font-bold">
                {band.min} – {band.max}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">
          Scoring Rules ({data.rules.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-cyber-base/60">
                <th className="px-4 py-3 text-left font-semibold text-slate-300">Rule</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-300">Points</th>
              </tr>
            </thead>
            <tbody>
              {data.rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-white/5 transition hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3 text-slate-50">{rule.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    +{rule.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Lead Statuses</h2>
        <div className="flex flex-wrap gap-2">
          {data.statuses.map((s) => (
            <span
              key={s}
              className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Admin Fields</h2>
        <div className="flex flex-wrap gap-1">
          {data.adminFields.map((f) => (
            <span
              key={f}
              className="rounded bg-emerald-600/10 px-2 py-0.5 font-mono text-xs text-emerald-400"
            >
              {f}
            </span>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
