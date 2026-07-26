import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Findings - Admin - Maine CyberTech" };

function severityPill(s: string) {
  const c = s === "p0" ? "red" : s === "p1" ? "amber" : s === "p2" ? "blue" : "slate";
  const map = {
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${map[c]}`}
    >
      {s.toUpperCase()}
    </span>
  );
}

function statusPill(s: string) {
  const c =
    s === "closed" || s === "verified"
      ? "emerald"
      : s === "resolved"
        ? "blue"
        : s === "in_progress"
          ? "amber"
          : s === "wont_fix"
            ? "slate"
            : "red";
  const map = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] ${map[c]}`}
    >
      {s}
    </span>
  );
}

export default async function FindingsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let findings: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    source: string;
    remediation_deadline: string | null;
    created_at: string;
  }> = [];
  let stats = {
    bySeverity: { p0: 0, p1: 0, p2: 0, p3: 0 },
    byStatus: {} as Record<string, number>,
    total: 0,
  };

  try {
    const [result, statsResult] = await Promise.allSettled([
      api.findings.list({}),
      api.findings.stats({}),
    ]);
    if (result.status === "fulfilled") findings = result.value.items as typeof findings;
    if (statsResult.status === "fulfilled") stats = statsResult.value;
  } catch {
    // Gracefully degrade
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Findings" }]} />
      }
      subnav={<AdminSubnav current="findings" />}
      title="Open Findings & Remediation Tracker"
      description="P0/P1/P2/P3 finding lifecycle for security, network, SOP, and client assessments."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">P0: {stats.bySeverity.p0}</div>
          <div className="cyber-pill">P1: {stats.bySeverity.p1}</div>
          <div className="cyber-pill">P2: {stats.bySeverity.p2}</div>
          <div className="cyber-pill">P3: {stats.bySeverity.p3}</div>
        </div>
      }
    >
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Findings ({stats.total})</h2>
          <Link href="/admin/findings/new" className="cyber-button">
            New Finding
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {findings.length > 0 ? (
            findings.map((f) => (
              <Link
                key={f.id}
                href={`/admin/findings/${f.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{f.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {f.source} &bull; Created {new Date(f.created_at).toISOString().slice(0, 10)}
                      {f.remediation_deadline
                        ? ` &bull; Due ${new Date(f.remediation_deadline).toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {severityPill(f.severity)}
                    {statusPill(f.status)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🔍"
              title="No findings yet"
              description="Record your first security or compliance finding."
              actionHref="/admin/findings/new"
              actionLabel="New Finding"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
