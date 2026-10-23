import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { hasPermission } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Change Requests - Portal - Maine CyberTech" };

export default async function PortalChangeRequestsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  try {
    const r = await api.governance.changes.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
    total = r.total ?? items.length;
  } catch (error) {
    console.error("[change-requests/page]", error);
    loadFailed = true;
  }

  const permissions = await Promise.resolve()
    .then(() => api.permissions.getMyPermissions())
    .catch(() => null);
  const canCreate =
    Boolean(permissions?.isSuperAdmin) ||
    hasPermission(permissions?.keys, "change-requests", "create");

  return (
    <div className="space-y-6" role="region" aria-label="Change Requests">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Change Requests" }]}
      />
      {loadFailed ? <DataErrorNote what="change-requests" /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">Change Requests</h1>
          <p className="mt-1 text-sm text-slate-400">
            {total} change request{total !== 1 ? "s" : ""} for your organization.
          </p>
        </div>
        {canCreate ? (
          <Link href="/portal/change-requests/new" className="cyber-button">
            New change request
          </Link>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <Link
            key={String(a.id)}
            href={`/portal/change-requests/${String(a.id)}`}
            className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.title || a.name || "")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Priority: {String(a.priority || "N/A")} &bull; Type: {String(a.change_type || "N/A")}
            </p>
            {(a.implementation_date as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Planned: {formatDate(a.implementation_date)}
              </p>
            )}
          </Link>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="📝" title="No change requests yet." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
