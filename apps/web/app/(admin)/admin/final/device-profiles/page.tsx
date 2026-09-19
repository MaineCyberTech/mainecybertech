import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import CrudForm from "@/components/admin/CrudForm";
import AdminPagination from "@/components/admin/AdminPagination";
import { createDeviceProfile } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Device Profiles - Admin - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type DeviceProfilesPageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function DeviceProfilesPage({ searchParams }: DeviceProfilesPageProps) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let profiles: Array<{
    id: string;
    name: string;
    type: string | null;
    manufacturer: string | null;
    model: string | null;
    created_at: string;
  }> = [];
  let total = 0;

  try {
    const r = await api.deviceProfiles.list({ page, limit });
    profiles = r.items as typeof profiles;
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/admin/final/device-profiles?page=${p}&limit=${limit}`;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "More Tools", href: "/admin/final" },
            { label: "Device Profiles" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Device Profiles"
      description="Standard device profiles with type, manufacturer, model, and specs."
      actions={
        <div className="cyber-pill">{total} Total</div>
      }
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "name", label: "Name", required: true },
          { key: "type", label: "Type" },
          { key: "manufacturer", label: "Manufacturer" },
          { key: "model", label: "Model" },
        ]}
        title="New Device Profile"
        action={createDeviceProfile}
      />
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Device Profiles</h2>
        </div>
        <div className="mt-6 space-y-3">
          {profiles.length > 0 ? (
            profiles.map((p) => (
              <Link
                key={p.id}
                href={`/admin/final/device-profiles/${p.id}`}
                className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{p.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {p.manufacturer}
                      {p.model ? ` ${p.model}` : ""}
                      {p.type ? ` &bull; ${p.type}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🖥️"
              title="No device profiles"
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
