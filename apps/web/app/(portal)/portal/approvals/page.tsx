import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals - Portal - Maine CyberTech" };

function PriorityBadge({ priority }: { priority: string }) {
  const classes =
    priority === "urgent"
      ? "bg-red-500/20 text-red-400"
      : priority === "high"
        ? "bg-amber-500/20 text-amber-400"
        : priority === "normal"
          ? "bg-sky-500/20 text-sky-400"
          : "bg-slate-500/20 text-slate-400";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {priority}
    </span>
  );
}

export default async function ApprovalsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.approvals.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch (error) {
    console.error("[approvals/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Approvals">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Approvals" }]}
      />
      <PortalSubnav current="approvals" />
      {loadFailed ? <DataErrorNote what="approvals" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Approvals</h1>
      <p className="text-sm text-slate-400">
        {items.length} approval request{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">
              {String(item.request_subject ?? "Untitled")}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <StatusPill status={String(item.status ?? "pending")} />
              <PriorityBadge priority={String(item.priority ?? "normal")} />
              {item.request_type != null && <span>Type: {String(item.request_type)}</span>}
              {item.requested_by != null && <span>By: {String(item.requested_by)}</span>}
              {item.due_at != null && <span>Due: {formatDate(item.due_at)}</span>}
            </div>
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <EmptyState icon="✅" title="No approval requests found." />
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
