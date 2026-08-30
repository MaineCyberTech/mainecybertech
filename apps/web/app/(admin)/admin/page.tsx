import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import EmptyState from "@/components/EmptyState";
import type { Ticket, Document, Project, Organization, Membership, AuditLog } from "@mct/sdk";

export const metadata = { title: "Admin Dashboard - Maine CyberTech" };

export const dynamic = "force-dynamic";

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
function ticketSubject(t: Ticket & { subject?: string }) {
  return t?.subject ?? t?.title ?? `Ticket ${t?.id}`;
}
function ticketStatus(t: Ticket & { state?: string }) {
  return String(t?.status ?? t?.state ?? "new").toLowerCase();
}
function ticketPriority(t: Ticket & { severity?: string }) {
  return String(t?.priority ?? t?.severity ?? "normal").toLowerCase();
}
function documentName(d: Document & { title?: string }) {
  return d?.name ?? d?.title ?? d?.file_name ?? `Document ${d?.id}`;
}
function documentVisibility(d: Document) {
  return String(d?.visibility ?? "private").toLowerCase();
}
function projectName(p: Project & { title?: string }) {
  return p?.name ?? p?.title ?? `Project ${p?.id}`;
}
function isDeletedTicket(t: Ticket & { subject?: string; is_deleted?: boolean; deleted?: boolean; deleted_at?: string; archived_at?: string }) {
  const title = String(t?.title ?? t?.subject ?? "");
  return (
    Boolean(t?.is_deleted ?? t?.deleted ?? t?.deleted_at ?? t?.archived_at ?? t?.resolution) ||
    title.startsWith("[Deleted] ")
  );
}
function pill(c: "emerald" | "amber" | "blue" | "red" | "slate") {
  const map = {
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    red: "border-red-500/25 bg-red-500/10 text-red-300",
    slate: "border-white/10 bg-white/5 text-slate-300",
  } as const;
  return `inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] leading-none ${map[c]}`;
}
const quick =
  "rounded-lg border border-white/10 bg-cyber-base/60 p-5 transition hover:border-emerald-600/25 hover:bg-cyber-base/80";

export default async function AdminHomePage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [
    orgsResult,
    ticketsResult,
    docsResult,
    projectsResult,
    pendingMembershipsResult,
    pendingOrgsResult,
    auditResult,
  ] = await Promise.all([
    api.organizations.list({ limit: 100 }),
    api.tickets.list({}),
    api.documents.list({}),
    api.projects.list({}),
    api.memberships.list({ status: "pending" }),
    api.organizations.list({ status: "pending", limit: 100 }),
    api.audit.list({ limit: 8 }),
  ]);
  const orgs = orgsResult.items ?? [];
  const orgMap = new Map(orgs.map((o: Organization) => [o.id, o.name ?? o.id]));
  const recentTicketsAll = (ticketsResult.items ?? []) as Ticket[];
  const recentTickets = recentTicketsAll.filter((t) => !isDeletedTicket(t)).slice(0, 8);
  const recentDocs = (docsResult.items ?? []).slice(0, 5) as Document[];
  const recentProjects = (projectsResult.items ?? []).slice(0, 5) as Project[];
  const pendingMemberships = pendingMembershipsResult.slice(0, 5) as Membership[];
  const pendingOrganizations = pendingOrgsResult.items?.slice(0, 5) ?? [];
  const openTicketCount = recentTicketsAll.filter(
    (t) =>
      !isDeletedTicket(t) &&
      !["resolved", "closed", "complete", "completed"].includes(ticketStatus(t)),
  ).length;
  const recentAudit = (auditResult.items ?? []).slice(0, 5) as AuditLog[];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin" }]} />
      <AdminSubnav current="home" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              Organizations
            </p>
            <p className="font-orbitron text-lg text-slate-50 sm:text-xl">{orgs.length}</p>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            Total customer organizations in the platform.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              Tickets
            </p>
            <p className="font-orbitron text-lg text-slate-50 sm:text-xl">
              {ticketsResult.total ?? recentTicketsAll.length}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            {openTicketCount} open or in progress from recent queue items.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              Documents
            </p>
            <p className="font-orbitron text-lg text-slate-50 sm:text-xl">
              {docsResult.total ?? recentDocs.length}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            Document records across all client organizations.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              Projects
            </p>
            <p className="font-orbitron text-lg text-slate-50 sm:text-xl">
              {projectsResult.total ?? recentProjects.length}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            Tracked project work across organizations.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
              Pending Approvals
            </p>
            <p className="font-orbitron text-lg text-slate-50 sm:text-xl">
              {pendingOrganizations.length + pendingMembershipsResult.length}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-400 sm:mt-3 sm:text-sm">
            {pendingOrganizations.length} orgs &bull; {pendingMembershipsResult.length} memberships
            waiting.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Recent Support Activity</h2>
            <Link href="/admin/tickets" className="cyber-button-secondary">
              View Tickets
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {recentTickets.length > 0 ? (
              recentTickets.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tickets/${t.id}`}
                  className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-50">{ticketSubject(t)}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Org: {orgMap.get(t.organization_id) ?? t.organization_id} • Updated{" "}
                        {rel(t.updated_at ?? t.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={pill(
                          ["resolved", "closed", "complete", "completed"].includes(ticketStatus(t))
                            ? "emerald"
                            : ["triaged", "pending", "waiting", "on_hold"].includes(ticketStatus(t))
                              ? "amber"
                              : "blue",
                        )}
                      >
                        {ticketStatus(t)}
                      </span>
                      <span
                        className={pill(
                          ticketPriority(t) === "urgent"
                            ? "red"
                            : ticketPriority(t) === "high"
                              ? "amber"
                              : "slate",
                        )}
                      >
                        {ticketPriority(t)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon="🎫"
                title="No recent ticket activity"
                description="Support tickets from client organizations will appear here."
              />
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Recent Document Activity</h2>
            <Link href="/admin/documents" className="cyber-button-secondary">
              View Documents
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {recentDocs.length > 0 ? (
              recentDocs.map((d) => (
                <Link
                  key={d.id}
                  href="/admin/documents"
                  className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-50">{documentName(d)}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        Org: {orgMap.get(d.organization_id) ?? d.organization_id} • Updated{" "}
                        {rel(d.updated_at ?? d.created_at)}
                      </p>
                    </div>
                    <span
                      className={pill(
                        documentVisibility(d) === "org"
                          ? "emerald"
                          : documentVisibility(d) === "restricted"
                            ? "amber"
                            : "slate",
                      )}
                    >
                      {documentVisibility(d)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon="📄"
                title="No recent document activity"
                description="Document records across organizations will appear here."
              />
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Recent Project Activity</h2>
            <Link href="/admin/projects" className="cyber-button-secondary">
              View Projects
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="block rounded-lg border border-white/10 bg-cyber-base/60 p-4 transition hover:border-emerald-500/20 hover:bg-cyber-base/80"
                >
                  <p className="font-medium text-slate-50">{projectName(p)}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Updated {rel(p.updated_at ?? p.created_at)}
                  </p>
                </Link>
              ))
            ) : (
              <EmptyState
                icon="📋"
                title="No recent project activity"
                description="Project work across organizations will appear here."
              />
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Recent Audit Activity</h2>
            <Link href="/admin/audit" className="cyber-button-secondary">
              View Audit
            </Link>
          </div>
          <div className="mt-6 space-y-2">
            {recentAudit.length > 0 ? (
              recentAudit.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-cyber-base/60 px-4 py-3"
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
                title="No recent audit activity"
                description="Audit events from the platform will appear here."
              />
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Pending Membership Approvals</h2>
            <Link href="/admin/approvals" className="cyber-button-secondary">
              Open Queue
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {pendingMemberships.length > 0 ? (
              pendingMemberships.map((m) => (
                <div key={m.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                  <p className="font-medium text-slate-50">
                    {orgMap.get(m.organization_id) ?? m.organization_id}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">User: {m.user_id}</p>
                  <p className="mt-1 text-xs text-slate-400">Requested {rel(m.created_at)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                icon="👥"
                title="No pending memberships"
                description="New membership requests will appear here for review."
              />
            )}
          </div>
        </section>
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="cyber-heading text-lg">Pending Organization Requests</h2>
            <Link href="/admin/approvals" className="cyber-button-secondary">
              Open Queue
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {pendingOrganizations.length > 0 ? (
              pendingOrganizations.map((o) => (
                <div key={o.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                  <p className="font-medium text-slate-50">{o.name ?? o.id}</p>
                  <p className="mt-2 text-xs text-slate-400">Requested {rel(o.created_at)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                icon="🏢"
                title="No pending organizations"
                description="New organization requests will appear here for review."
              />
            )}
          </div>
        </section>
      </div>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Quick Actions</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-7">
          <Link href="/admin/approvals" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Approvals
            </h3>
            <p className="mt-3 text-sm text-slate-400">Review pending orgs and memberships.</p>
          </Link>
          <Link href="/admin/organizations" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Organizations
            </h3>
            <p className="mt-3 text-sm text-slate-400">Manage customer org records and settings.</p>
          </Link>
          <Link href="/admin/users" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Users
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Review memberships and access assignments.
            </p>
          </Link>
          <Link href="/admin/tickets" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Tickets
            </h3>
            <p className="mt-3 text-sm text-slate-400">Jump into the active support queue.</p>
          </Link>
          <Link href="/admin/documents" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Documents
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Review and manage client document records.
            </p>
          </Link>
          <Link href="/admin/projects" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Projects
            </h3>
            <p className="mt-3 text-sm text-slate-400">
              Review active delivery work and milestones.
            </p>
          </Link>
          <Link href="/portal/dashboard" className={quick}>
            <h3 className="font-orbitron text-sm uppercase tracking-[0.12em] text-slate-50">
              Client Portal
            </h3>
            <p className="mt-3 text-sm text-slate-400">Open the customer-facing portal.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
