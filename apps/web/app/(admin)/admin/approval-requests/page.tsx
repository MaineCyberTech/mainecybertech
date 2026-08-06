import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approval Requests - Admin" };

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

export default async function ApprovalRequestsAdminPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<Record<string, unknown>> = [];
  let stats: Record<string, number> = {};
  try {
    const r = await api.approvals.list({ limit: 100, page: 1 });
    items = r.items as unknown as typeof items;
  } catch {}
  try {
    stats = (await api.approvals.stats()) as unknown as Record<string, number>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Approval Requests" }]} />
      }
      subnav={<AdminSubnav current="approvals" />}
      title="Approval Workflow Engine"
      description="Review, approve, or reject approval requests across all organizations (proposals, changes, budgets, procurement, client sign-offs)."
      actions={
        <Link href="/admin/approvals" className="cyber-button-secondary">
          Membership Queue
        </Link>
      }
    >
      {Object.keys(stats).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {["pending", "approved", "rejected", "cancelled"].map((k) => (
            <div
              key={k}
              className="rounded-lg border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm"
            >
              <span className="capitalize text-slate-400">{k}: </span>
              <span className="font-semibold text-slate-50">{stats[k] ?? 0}</span>
            </div>
          ))}
        </div>
      )}
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((a) => (
              <div
                key={String(a.id)}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
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
            ))
          ) : (
            <EmptyState
              icon="✅"
              title="No approval requests"
              description="Approval requests created by proposals, change requests, budgets, and client sign-offs appear here."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
