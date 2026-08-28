import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Device Profiles - Portal - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type DeviceProfilesPageProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function DeviceProfilesPage({ searchParams }: DeviceProfilesPageProps) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let items: Array<{
    id: string;
    name: string;
    type: string | null;
    manufacturer: string | null;
    model: string | null;
    specs: Record<string, unknown>;
    created_at: string;
  }> = [];
  let total = 0;

  try {
    const r = await api.deviceProfiles.list({ organizationId: orgId, page, limit });
    items = r.items as unknown as typeof items;
    total = r.total ?? 0;
  } catch {}

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/portal/device-profiles?page=${p}&limit=${limit}`;

  return (
    <div className="space-y-6" role="region" aria-label="Device Profiles">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Device Profiles" }]}
      />
      <PortalSubnav current="device-profiles" />
      <h1 className="text-2xl font-semibold text-slate-50">Device Configuration Profiles</h1>
      <p className="text-sm text-slate-400">
        {total} profile{total !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">
              {String(item.name ?? "Untitled")}
            </p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.manufacturer != null && <span>Manufacturer: {String(item.manufacturer)}</span>}
              {item.model != null && <span>Model: {String(item.model)}</span>}
              {item.type != null && <span>Type: {String(item.type)}</span>}
            </div>
            {item.specs != null && Object.keys(item.specs).length > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                {Object.entries(item.specs)
                  .map(([k, v]) => `${k}: ${String(v)}`)
                  .join(", ")}
              </p>
            )}
            {item.created_at != null && (
              <span className="mt-2 block text-xs text-slate-400">
                Created: {new Date(String(item.created_at)).toISOString().slice(0, 10)}
              </span>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No device profiles found.</p>}
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />

      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
