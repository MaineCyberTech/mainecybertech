import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business OS - Admin - Maine CyberTech" };

function rel(value?: string | null) {
  if (!value) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}

function statCard(label: string, value: number, description: string, href?: string) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">{label}</p>
        <p className="font-orbitron text-xl text-slate-50">{value}</p>
      </div>
      <p className="mt-3 text-sm text-slate-400">{description}</p>
      {href && (
        <Link
          href={href}
          className="mt-3 inline-block text-xs text-emerald-500 hover:text-emerald-400"
        >
          View details →
        </Link>
      )}
    </div>
  );
}

export default async function BusinessOsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  const [summary, overdueApprovals, recentActivity, orgHealth] = await Promise.all([
    api.dashboard.businessOsSummary(),
    api.dashboard.approvalsOverdue(),
    api.dashboard.recentActivity({ limit: 10 }),
    api.dashboard.orgHealth(),
  ]);

  const overdue = overdueApprovals as { items: unknown[]; total: number };
  const activity = recentActivity as unknown[];
  const health = orgHealth as Array<{
    id: string;
    name: string;
    openTickets: number;
    activeProjects: number;
  }>;

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Business OS" }]} />
      }
      subnav={<AdminSubnav current="business-os" />}
      title="Business OS Dashboard"
      description="Private operating dashboard for client health, approvals, projects, and platform metrics."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {statCard(
          "Organizations",
          summary.organizations.total,
          `${summary.organizations.approved} approved, ${summary.organizations.pending} pending`,
          "/admin/organizations",
        )}
        {statCard(
          "Open Tickets",
          summary.tickets.open,
          "Active support tickets across all clients",
          "/admin/tickets",
        )}
        {statCard(
          "Active Projects",
          summary.projects.active,
          "In-progress delivery work",
          "/admin/projects",
        )}
        {statCard(
          "Documents",
          summary.documents.total,
          "Records across all organizations",
          "/admin/documents",
        )}
        {statCard(
          "Pending Approvals",
          summary.approvals.pending,
          "Awaiting review and action",
          "/admin/approvals",
        )}
        {statCard("Users", summary.users.total, "Platform user accounts", "/admin/users")}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Overdue Approvals</h2>
            <Link href="/admin/approvals" className="cyber-button-secondary">
              Open Queue
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {overdue.items.length > 0 ? (
              overdue.items.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-500/20 bg-[#0A1118]/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-50">{item.request_subject}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.request_type} &bull; Due {rel(item.due_at)}
                      </p>
                    </div>
                    <span className="inline-flex min-h-8 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                      Overdue
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon="✅"
                title="No overdue approvals"
                description="All pending approval requests are on schedule."
              />
            )}
          </div>
        </section>

        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Platform Activity</h2>
            <Link href="/admin/audit" className="cyber-button-secondary">
              View Audit
            </Link>
          </div>
          <div className="mt-6 space-y-2">
            {activity.length > 0 ? (
              activity.slice(0, 10).map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0A1118]/60 px-4 py-3"
                >
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300">{log.action}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{rel(log.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon="📊"
                title="No recent activity"
                description="Audit events from the platform will appear here."
              />
            )}
          </div>
        </section>
      </div>

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Organization Health</h2>
          <span className="text-xs text-slate-400">{health.length} organizations</span>
        </div>
        <div className="mt-6 space-y-3">
          {health.length > 0 ? (
            health.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-slate-50">{org.name}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{org.openTickets} open tickets</span>
                    <span>{org.activeProjects} active projects</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🏢"
              title="No organizations"
              description="Approved organizations will appear here."
            />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Recent Organizations</h2>
        <div className="mt-6 space-y-3">
          {summary.organizations.recent.length > 0 ? (
            summary.organizations.recent.map((org) => (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{org.name}</p>
                    <p className="mt-1 text-xs text-slate-400">Created {rel(org.createdAt)}</p>
                  </div>
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${org.status === "approved" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-300"}`}
                  >
                    {org.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🏢"
              title="No organizations yet"
              description="Organizations will appear here when added."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
