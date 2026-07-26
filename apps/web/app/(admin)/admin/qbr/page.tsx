import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "QBR Reports - Admin - Maine CyberTech" };

const statusPill = (s: string) => {
  const c = s === "draft" ? "amber" : s === "approved" || s === "sent" ? "emerald" : "slate";
  const m = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${m[c]}`}
    >
      {s}
    </span>
  );
};

export default async function QbrPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let reports: Array<{
    id: string;
    title: string;
    status: string;
    period_start: string | null;
    created_at: string;
  }> = [];

  try {
    const r = await api.qbr.list({});
    reports = r.items as typeof reports;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "QBR Reports" }]} />
      }
      subnav={<AdminSubnav current="qbr" />}
      title="QBR Executive Reports"
      description="Generate monthly/quarterly reports aggregating tickets, projects, findings, assets, and security posture."
      actions={
        <Link href="/admin/qbr/new" className="cyber-button">
          Generate Report
        </Link>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Reports</h2>
        <div className="mt-6 space-y-3">
          {reports.length > 0 ? (
            reports.map((r) => (
              <Link
                key={r.id}
                href={`/admin/qbr/${r.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{r.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {r.period_start
                        ? `${r.period_start} → ${new Date(r.created_at).toISOString().slice(0, 10)}`
                        : `Generated ${new Date(r.created_at).toISOString().slice(0, 10)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">{statusPill(r.status)}</div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="📊"
              title="No QBR reports yet"
              description="Generate your first quarterly business review report aggregating data across all client modules."
              actionHref="/admin/qbr/new"
              actionLabel="Generate Report"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
