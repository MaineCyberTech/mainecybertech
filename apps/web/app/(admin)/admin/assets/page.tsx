import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import CrudForm from "@/components/admin/CrudForm";
import AdminPagination from "@/components/admin/AdminPagination";
import { createAsset } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assets - Admin - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

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

type AssetsPageProps = {
  searchParams?: Promise<{ page?: string; limit?: string }>;
};

export default async function AssetsPage({ searchParams }: AssetsPageProps = {}) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = (await searchParams) ?? {};
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

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
  let total = 0;

  try {
    const [r, s] = await Promise.allSettled([
      api.assets.list({ page, limit }),
      api.assets.stats({}),
    ]);
    if (r.status === "fulfilled") {
      assets = r.value.items as typeof assets;
      total = r.value.total ?? 0;
    }
    if (s.status === "fulfilled") stats = s.value;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/admin/assets?page=${p}&limit=${limit}`;

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
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "name", label: "Name", required: true },
          { key: "assetType", label: "Type", required: true },
          { key: "make", label: "Make" },
          { key: "model", label: "Model" },
          { key: "serialNumber", label: "Serial" },
          { key: "assetTag", label: "Tag" },
          { key: "purchaseDate", label: "Purchase Date", type: "date" },
          { key: "warrantyExpires", label: "Warranty Expires", type: "date" },
          { key: "location", label: "Location" },
        ]}
        title="New Asset"
        action={createAsset}
      />
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
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
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

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />
    </AdminPageShell>
  );
}
