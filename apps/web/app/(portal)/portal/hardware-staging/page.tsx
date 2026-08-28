import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";
import AdminPagination from "@/components/admin/AdminPagination";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hardware Staging - Portal - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

type PortalHardwareStagingProps = {
  searchParams: Promise<{ page?: string; limit?: string }>;
};

export default async function PortalHardwareStagingPage({ searchParams }: PortalHardwareStagingProps) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT));

  let items: Array<{
    id: string;
    device_name: string;
    asset_tag: string | null;
    status: string;
  }> = [];
  let total = 0;

  try {
    const r = await api.staging.list({ organizationId: orgId, page, limit });
    items = r.items as unknown as typeof items;
    total = r.total ?? 0;
  } catch {
    /* graceful */
  }

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => `/portal/hardware-staging?page=${p}&limit=${limit}`;

  return (
    <div className="space-y-6" role="region" aria-label="Hardware Staging">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Hardware Staging" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Hardware Staging</h1>
      <p className="text-sm text-slate-400">
        {items.length} hardware staging item{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/portal/hardware-staging/${a.id}`}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{a.device_name}</p>
              <StatusPill status={a.status || "unknown"} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {a.asset_tag ? `Tag: ${a.asset_tag}` : "No asset tag"}
            </p>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No hardware staging items.</p>
        )}
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
