import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminListPage from "@/components/admin/AdminListPage";
import AdminPagination from "@/components/admin/AdminPagination";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approval Requests - Admin" };

const DEFAULT_LIMIT = 25;

function pill(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400",
    approved: "bg-emerald-500/20 text-emerald-400",
    rejected: "bg-red-500/20 text-red-400",
    cancelled: "bg-slate-500/20 text-slate-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.cancelled}`}
    >
      {status}
    </span>
  );
}

type ApprovalRequestsPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    requestType?: string;
    search?: string;
  }>;
};

export default async function ApprovalRequestsAdminPage({
  searchParams,
}: ApprovalRequestsPageProps) {
  await requireAdminAccess();
  const api = getApiClient();

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(sp.limit ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT),
  );
  const status = sp.status;
  const requestType = sp.requestType;
  const search = sp.search;

  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  let stats: Record<string, number> = {};
  try {
    const r = await api.approvals.list({ page, limit, status, requestType, search });
    items = r.items as unknown as typeof items;
    total = r.total ?? 0;
  } catch {}
  try {
    stats = (await api.approvals.stats()) as unknown as Record<string, number>;
  } catch {}

  const totalPages = Math.ceil(total / limit);
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    if (requestType) params.set("requestType", requestType);
    if (search) params.set("search", search);
    return `/admin/approval-requests?${params.toString()}`;
  };

  return (
    <>
      <AdminListPage
        title="Approval Workflow Engine"
        description="Review, approve, or reject approval requests across all organizations (proposals, changes, budgets, procurement, client sign-offs)."
        subnavCurrent="approvals"
        items={items}
        panel
        actions={
          <Link href="/admin/approvals" className="cyber-button-secondary">
            Membership Queue
          </Link>
        }
        headerContent={
          Object.keys(stats).length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-3">
              {["pending", "approved", "rejected", "cancelled"].map((k) => (
                <div
                  key={k}
                  className="rounded-lg border border-white/10 bg-cyber-base/60 px-4 py-2 text-sm"
                >
                  <span className="capitalize text-slate-400">{k}: </span>
                  <span className="font-semibold text-slate-50">{stats[k] ?? 0}</span>
                </div>
              ))}
            </div>
          ) : null
        }
        emptyState={
          <EmptyState
            icon="✅"
            title="No approval requests"
            description="Approval requests created by proposals, change requests, budgets, and client sign-offs appear here."
          />
        }
        getId={(a) => String(a.id)}
        renderRow={(a) => (
          <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <Link
              className="transition hover:text-emerald-400"
              href={`/admin/approval-requests/${a.id}`}
            >
              <p className="font-medium text-slate-50">{String(a.request_subject)}</p>
            </Link>
            <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                {String(a.request_type || "unknown")}
              </span>
              {a.source_module != null && (
                <span className="rounded-full border border-white/10 px-2 py-0.5">
                  {String(a.source_module)}
                </span>
              )}
              <span className="rounded-full border border-white/10 px-2 py-0.5">
                Priority: {String(a.priority || "normal")}
              </span>
              {pill(String(a.status || "pending"))}
            </p>
          </div>
        )}
      />
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildHref}
        total={total}
        limit={limit}
      />
    </>
  );
}
