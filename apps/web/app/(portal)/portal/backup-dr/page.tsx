import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Backup & DR - Portal - Maine CyberTech" };

export default async function PortalBackupDrPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.backups.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[backup-dr/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Backup & DR">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Backup & DR" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Backup &amp; Disaster Recovery</h1>
      {loadFailed ? <DataErrorNote what="backup-dr" /> : null}
      <p className="text-sm text-slate-400">
        {items.length} backup job{items.length !== 1 ? "s" : ""} configured for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.system_name || "Backup")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Type: {String(a.backup_type || "N/A")} &bull; Status:{" "}
              {String(a.last_backup_status || "N/A")}
            </p>
            {(a.last_backup_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Last backup: {formatDate(a.last_backup_at)}
              </p>
            )}
            {a.offsite_replicated != null && (
              <p className="mt-1 text-xs text-slate-400">
                Offsite: {a.offsite_replicated ? "Yes" : "No"} &bull; Encrypted:{" "}
                {a.encryption_enabled ? "Yes" : "No"}
              </p>
            )}
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="💾" title="No backup jobs configured." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
