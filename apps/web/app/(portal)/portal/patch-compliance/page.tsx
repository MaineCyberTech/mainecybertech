import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Patch Compliance - Portal - Maine CyberTech" };

export default async function PortalPatchCompliancePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.securityOps.patchCompliance.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[patch-compliance/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Patch Compliance">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Patch Compliance" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Patch Compliance</h1>
      {loadFailed ? <DataErrorNote what="patch-compliance" /> : null}
      <p className="text-sm text-slate-400">
        {items.length} device{items.length !== 1 ? "s" : ""} tracked for patch compliance.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">
                {String(a.device_group || "Device group")}
              </p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Compliance: {a.compliance_pct != null ? `${String(a.compliance_pct)}%` : "N/A"} &bull;
              Pending: {String(a.pending_patches ?? 0)} &bull; Critical:{" "}
              {String(a.critical_patches ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Patched {String(a.patched_devices ?? 0)}/{String(a.total_devices ?? 0)} devices
              {a.exception_count ? ` • ${String(a.exception_count)} exceptions` : ""}
            </p>
            {a.last_patch_date ? (
              <p className="mt-1 text-xs text-slate-400">
                Last patched: {formatDate(a.last_patch_date)}
              </p>
            ) : null}
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="🔄" title="No patch compliance data available." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
