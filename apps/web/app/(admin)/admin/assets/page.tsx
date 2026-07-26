import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assets - Admin - Maine CyberTech" };

const statusPill = (s: string) => {
  const c =
    s === "active" ? "emerald" : s === "retired" ? "slate" : s === "repair" ? "amber" : "red";
  const m = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
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

export default async function AssetsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let assets: Array<{
    id: string;
    name: string;
    asset_type: string;
    status: string;
    make: string | null;
    model: string | null;
    warranty_expires: string | null;
    created_at: string;
  }> = [];
  let stats = { byType: {} as Record<string, number>, total: 0, expiringWarranty: 0 };

  try {
    const [r, s] = await Promise.allSettled([api.assets.list({}), api.assets.stats({})]);
    if (r.status === "fulfilled") assets = r.value.items as typeof assets;
    if (s.status === "fulfilled") stats = s.value;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Assets" }]} />
      }
      subnav={<AdminSubnav current="assets" />}
      title="Asset & Warranty Tracker"
      description="Hardware register with warranties, lifecycle scoring, and replacement planning."
      actions={
        <div className="flex flex-wrap gap-2">
          <div className="cyber-pill">{stats.total} Total</div>
          <div className="cyber-pill">{stats.expiringWarranty} Warranty Expiring</div>
        </div>
      }
    >
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Assets</h2>
        </div>
        <div className="mt-6 space-y-3">
          {assets.length > 0 ? (
            assets.map((a) => (
              <Link
                key={a.id}
                href={`/admin/assets/${a.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{a.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {a.make}
                      {a.model ? ` ${a.model}` : ""} &bull; {a.asset_type}
                      {a.warranty_expires
                        ? ` &bull; Warranty: ${new Date(a.warranty_expires).toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">{statusPill(a.status)}</div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="💻"
              title="No assets registered"
              description="Add hardware, warranties, and lifecycle data."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
