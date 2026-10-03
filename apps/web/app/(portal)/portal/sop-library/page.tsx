import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "SOP Library - Portal - Maine CyberTech" };

export default async function PortalSopLibraryPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.governance.sopLibrary.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[sop-library/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="SOP Library">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "SOP Library" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">SOP Library</h1>
      {loadFailed ? <DataErrorNote what="sop-library" /> : null}
      <p className="text-sm text-slate-400">
        {items.length} standard operating procedure{items.length !== 1 ? "s" : ""} for your
        organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.title || a.name || "")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Category: {String(a.category || "N/A")} &bull; Version: {String(a.version || "N/A")}
            </p>
            {(a.updated_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">Updated: {formatDate(a.updated_at)}</p>
            )}
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="📖" title="No SOPs available yet." />
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
