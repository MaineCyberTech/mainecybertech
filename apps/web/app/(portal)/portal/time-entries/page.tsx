import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import EmptyState from "@/components/EmptyState";
import PortalSubnav from "@/components/portal/PortalSubnav";

import DataErrorNote from "@/components/admin/DataErrorNote";
import AdminPagination from "@/components/admin/AdminPagination";
import { formatDate } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Time Entries - Portal - Maine CyberTech" };

const DEFAULT_LIMIT = 25;

export default async function PortalTimeEntriesPage(props: {
  searchParams?: Promise<{ page?: string; limit?: string }>;
}) {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  let loadFailed = false;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  const sp = (await props.searchParams) ?? {};
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
  );
  try {
    const r = await api.final.timeEntries.list({ organization_id: orgId, page, limit });
    items = r.items as unknown as typeof items;
    total = r.total ?? items.length;
  } catch (error) {
    console.error("[time-entries/page]", error);
    loadFailed = true;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Time Entries">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Time Entries" }]}
      />
      <PortalSubnav current="time-entries" />
      {loadFailed ? <DataErrorNote what="time-entries" /> : null}
      <h1 className="text-2xl font-semibold text-slate-50">Time Entries</h1>
      <p className="text-sm text-slate-400">
        {total} time entr{total === 1 ? "y" : "ies"} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.description)}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.hours != null ? <span>{Number(item.hours).toFixed(1)}h</span> : null}
              {item.work_date ? <span>Date: {formatDate(item.work_date)}</span> : null}
              {item.ticket_id ? <span>Ticket: {String(item.ticket_id).slice(0, 8)}</span> : null}
              <span>
                {item.billable ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                    Billable
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-slate-400">
                    Non-billable
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        {!loadFailed && items.length === 0 && (
          <EmptyState icon="⏱️" title="No time entries found." />
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
      <AdminPagination
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        buildHref={(p) => `/portal/time-entries?page=${p}&limit=${limit}`}
        total={total}
        limit={limit}
      />
    </div>
  );
}
