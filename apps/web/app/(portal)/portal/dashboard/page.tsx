import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { logger } from "@/lib/logger";
import PortalBreadcrumbs from "@/components/portal/PortalBreadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const metadata = { title: "Dashboard - Portal - Maine CyberTech" };

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
}

function ticketSubject(ticket: any) {
  return (
    ticket?.subject ?? ticket?.title ?? ticket?.name ?? `Ticket ${ticket?.id}`
  );
}

function auditActionLabel(action: string) {
  const map: Record<string, string> = {
    "ticket.create": "Ticket created",
    "ticket.update": "Ticket updated",
    "document.create": "Document uploaded",
    "document.update": "Document updated",
    "project.create": "Project created",
    "project.update": "Project updated",
    "membership.invite": "Member invited",
    "membership.update": "Member updated",
  };
  return map[action] ?? action.replace(/_/g, " ").replace(/\./g, " » ");
}

export default async function PortalDashboardPage() {
  const api = getApiClient();

  let membership;
  try {
    membership = await getApprovedMembership();
  } catch (err) {
    logger.error({ err }, "Failed to get membership");
  }

  if (!membership?.organization_id) {
    return (
      <div className="space-y-6">
        <PortalBreadcrumbs
          items={[
            { label: "Portal", href: "/portal/dashboard" },
            { label: "Dashboard" },
          ]}
        />
        <PortalSubnav current="dashboard" />
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          <h3 className="font-semibold">No Organization Access</h3>
          <p className="mt-2 text-sm">
            You are not currently a member of any organization. Please contact
            your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  let organization: any = null;
  let projects: any[] = [];
  let tickets: any[] = [];
  let documents: any[] = [];
  let recentActivity: any[] = [];

  try {
    const [
      orgResult,
      projectsResult,
      ticketsResult,
      documentsResult,
      auditResult,
    ] = await Promise.all([
      api.organizations.get(membership.organization_id).catch(() => null),
      api.projects
        .list({ organizationId: membership.organization_id })
        .catch(() => ({ items: [] })),
      api.tickets
        .list({ organizationId: membership.organization_id })
        .catch(() => ({ items: [] })),
      api.documents
        .list({ organizationId: membership.organization_id })
        .catch(() => ({ items: [] })),
      api.audit
        .list({ organizationId: membership.organization_id, limit: 10 })
        .catch(() => ({ items: [] })),
    ]);

    organization = orgResult;
    projects = (projectsResult.items ?? []).slice(0, 5);
    tickets = (ticketsResult.items ?? []).slice(0, 5);
    documents = (documentsResult.items ?? []).slice(0, 5);
    recentActivity = auditResult.items ?? [];
  } catch (err) {
    logger.error({ err }, "Failed to load dashboard data");
  }

  return (
    <div className="space-y-6">
      <PortalBreadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Dashboard" },
        ]}
      />
      <PortalSubnav current="dashboard" />

      <section className="cyber-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="cyber-heading text-2xl">Client Dashboard</h2>
            <p className="mt-3 text-slate-300">
              Organization: {organization?.name ?? "Loading..."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/portal/support" className="cyber-button">
              <svg
                className="mr-1.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14m-7-7h14" />
              </svg>
              Create Ticket
            </Link>
            <Link href="/portal/documents" className="cyber-button-secondary">
              <svg
                className="mr-1.5 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 12l5 5 5-5M12 17V3" />
              </svg>
              Upload Document
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cyber-heading text-lg">Recent Project Activity</h3>
            <Link href="/portal/projects" className="cyber-button-secondary">
              View Projects
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.length > 0 ? (
              projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
                >
                  <p className="font-medium text-slate-50">{project.name}</p>
                  <p
                    className="mt-2 text-xs text-slate-500"
                    title={formatDateTime(project.updated_at)}
                  >
                    Updated {formatRelativeTime(project.updated_at)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
                No recent project activity.
              </div>
            )}
          </div>
        </section>

        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="cyber-heading text-lg">Recent Support Activity</h3>
            <Link href="/portal/support" className="cyber-button-secondary">
              View Support
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {tickets.length > 0 ? (
              tickets.map((ticket: any) => (
                <Link
                  key={ticket.id}
                  href={`/portal/support/${ticket.id}`}
                  className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
                >
                  <p className="font-medium text-slate-50">
                    {ticketSubject(ticket)}
                  </p>
                  <p
                    className="mt-2 text-xs text-slate-500"
                    title={formatDateTime(
                      ticket.updated_at ?? ticket.created_at,
                    )}
                  >
                    Updated{" "}
                    {formatRelativeTime(ticket.updated_at ?? ticket.created_at)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
                No recent support activity.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="cyber-heading text-lg">Recent Documents</h3>
          <Link href="/portal/documents" className="cyber-button-secondary">
            View Documents
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {documents.length > 0 ? (
            documents.map((doc: any) => (
              <Link
                key={doc.id}
                href={`/portal/documents/${doc.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <p className="font-medium text-slate-50">{doc.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {doc.description ?? doc.mime_type ?? "File"}
                </p>
                <p
                  className="mt-1 text-xs text-slate-500"
                  title={formatDateTime(doc.updated_at ?? doc.created_at)}
                >
                  Updated {formatRelativeTime(doc.updated_at ?? doc.created_at)}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No recent documents.
            </div>
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="cyber-heading text-lg">Recent Activity</h3>
        </div>
        <div className="mt-4 space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((event: any) => (
              <div
                key={event.id}
                className="flex items-start gap-4 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <span className="mt-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 shrink-0">
                  {event.entity_type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-300">
                    {auditActionLabel(event.action)}
                  </p>
                  <p
                    className="mt-1 text-xs text-slate-500"
                    title={formatDateTime(event.created_at)}
                  >
                    {formatRelativeTime(event.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">
              No recent activity.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
