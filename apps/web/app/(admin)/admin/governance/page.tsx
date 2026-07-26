import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = { title: "Governance - Admin" };

export default async function GovernancePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let changes: Array<{
    id: string;
    title: string;
    change_type: string;
    risk_level: string;
    status: string;
  }> = [];
  let risks: Array<{
    id: string;
    risk_description: string;
    risk_category: string;
    status: string;
    risk_score: number | null;
  }> = [];
  let retention: Array<{
    id: string;
    data_category: string;
    system_name: string;
    retention_period_days: number;
    status: string;
  }> = [];
  let tabletop: Array<{
    id: string;
    title: string;
    scenario_type: string;
    status: string;
    scheduled_date: string | null;
  }> = [];

  try {
    const [c, r, rt, t] = await Promise.allSettled([
      api.governance.changes.list({}),
      api.governance.risks.list({}),
      api.governance.retention.list({}),
      api.governance.tabletop.list({}),
    ]);
    if (c.status === "fulfilled") changes = c.value.items as unknown as typeof changes;
    if (r.status === "fulfilled") risks = r.value.items as unknown as typeof risks;
    if (rt.status === "fulfilled") retention = rt.value.items as unknown as typeof retention;
    if (t.status === "fulfilled") tabletop = t.value.items as unknown as typeof tabletop;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Governance" }]} />
      }
      subnav={<AdminSubnav current="governance" />}
      title="Governance & Compliance Center"
      description="Change advisory, risk register, data retention, and tabletop exercise planning."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/governance/changes/new" className="cyber-button-sm">
            New Change
          </Link>
          <Link href="/admin/governance/risks/new" className="cyber-button-sm">
            New Risk
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Change Requests ({changes.length})</h2>
          <div className="mt-3 space-y-2">
            {changes.slice(0, 5).map((c) => (
              <div key={c.id} className="rounded border border-white/10 bg-[#0A1118]/60 p-3">
                <p className="text-sm text-slate-50">{c.title}</p>
                <p className="text-xs text-slate-400">
                  {c.change_type} &bull; {c.risk_level} risk &bull; {c.status}
                </p>
              </div>
            ))}
            {changes.length === 0 && (
              <p className="text-xs text-slate-400">No change requests yet.</p>
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Risk Register ({risks.length})</h2>
          <div className="mt-3 space-y-2">
            {risks.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded border border-white/10 bg-[#0A1118]/60 p-3">
                <p className="line-clamp-1 text-sm text-slate-50">{r.risk_description}</p>
                <p className="text-xs text-slate-400">
                  {r.risk_category} &bull; Score: {r.risk_score ?? "—"} &bull; {r.status}
                </p>
              </div>
            ))}
            {risks.length === 0 && (
              <p className="text-xs text-slate-400">No risks registered yet.</p>
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Data Retention ({retention.length})</h2>
          <div className="mt-3 space-y-2">
            {retention.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded border border-white/10 bg-[#0A1118]/60 p-3">
                <p className="text-sm text-slate-50">
                  {r.data_category} — {r.system_name}
                </p>
                <p className="text-xs text-slate-400">
                  {r.retention_period_days} days &bull; {r.status}
                </p>
              </div>
            ))}
            {retention.length === 0 && (
              <p className="text-xs text-slate-400">No retention policies yet.</p>
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Tabletop Exercises ({tabletop.length})</h2>
          <div className="mt-3 space-y-2">
            {tabletop.slice(0, 5).map((t) => (
              <div key={t.id} className="rounded border border-white/10 bg-[#0A1118]/60 p-3">
                <p className="text-sm text-slate-50">{t.title}</p>
                <p className="text-xs text-slate-400">
                  {t.scenario_type} &bull; {t.status}{" "}
                  {t.scheduled_date
                    ? `(${new Date(t.scheduled_date).toISOString().slice(0, 10)})`
                    : ""}
                </p>
              </div>
            ))}
            {tabletop.length === 0 && (
              <p className="text-xs text-slate-400">No exercises planned yet.</p>
            )}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
