import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import AdminPagination from "@/components/admin/AdminPagination";
import { createStaging } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hardware Staging - Field Services - Admin" };

const DEFAULT_LIMIT = 25;

const statusPill = (s: string) => {
  const c =
    s === "pending" ? "amber" : s === "in_progress" ? "sky" : s === "complete" ? "emerald" : "slate";
  const m = {
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    sky: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
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

type StagingPageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function StagingPage({ searchParams }: StagingPageProps) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let items: Array<{
    id: string;
    device_name: string;
    asset_tag: string | null;
    status: string;
    created_at: string;
  }> = [];
  let total = 0;

  try {
    const r = await api.staging.list({ page, limit });
    items = r.items as typeof items;
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/admin/field-services/staging?page=${p}&limit=${limit}`;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Field Services", href: "/admin/field-services" },
            { label: "Hardware Staging" },
          ]}
        />
      }
      subnav={<AdminSubnav current="field-services" />}
      title="Hardware Staging"
      description="Track device staging with type, serial, asset tag, and notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "deviceName", label: "Device Name", required: true },
          { key: "assetTag", label: "Asset Tag" },
          { key: "status", label: "Status", type: "select", options: ["pending", "in_progress", "complete"] },
        ]}
        title="New Device"
        action={createStaging}
      />
      <section className="cyber-panel mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Staged Devices</h2>
          <div className="cyber-pill">{total} Total</div>
        </div>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/admin/field-services/staging/${item.id}`}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.device_name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.asset_tag ? `Tag: ${item.asset_tag}` : "No asset tag"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">{statusPill(item.status)}</div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🖥️"
              title="No staged devices"
              description="Use the form above to create one."
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
