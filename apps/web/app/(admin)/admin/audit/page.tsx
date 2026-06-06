import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Log - Admin - Maine CyberTech" };

type AuditPageProps = {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    orgId?: string;
    userId?: string;
    page?: string;
  }>;
};

const ACTIONS = [
  "organization.create", "organization.update", "organization.delete",
  "organization.domain.add", "organization.domain.update", "organization.domain.delete",
  "membership.invite", "membership.update", "membership.remove",
  "project.create", "project.update", "project.delete",
  "project.task.create", "project.task.update", "project.task.delete",
  "ticket.create", "ticket.update", "ticket.comment.add",
  "document.create", "document.update", "document.delete", "document.replace",
  "user.role.update", "user.permission.override",
  "webhook.stripe",
];

const ENTITY_TYPES = [
  "organization", "organization_domain", "membership",
  "project", "project_task", "project_task_comment", "project_update",
  "ticket", "ticket_comment",
  "document",
  "user", "user_permission_override",
];

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAdminAccess();
  const params = await searchParams;

  const api = getApiClient();

  const logsResult = await api.audit.list({
    action: params.action || undefined,
    entityType: params.entityType || undefined,
    organizationId: params.orgId || undefined,
    actorUserId: params.userId || undefined,
    page: parseInt(params.page || "1"),
    limit: 50,
  });
  const logs = logsResult.items ?? [];
  const total = logsResult.total ?? 0;
  const currentPage = logsResult.page ?? 1;
  const totalPages = Math.ceil(total / (logsResult.limit ?? 50));

  const orgIds = [...new Set(logs.map((l: any) => l.organization_id).filter(Boolean))] as string[];
  const userIds = [...new Set(logs.map((l: any) => l.actor_user_id).filter(Boolean))] as string[];

  const [organizations, profiles] = await Promise.all([
    orgIds.length > 0 ? api.organizations.list({ ids: orgIds }) : Promise.resolve([] as any[]),
    userIds.length > 0 ? api.profiles.list({ ids: userIds }) : Promise.resolve([] as any[]),
  ]);

  const orgMap = new Map(organizations.map((o: any) => [o.id, o]));
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  function actionBadge(action: string) {
    if (action.includes("create") || action.includes("invite") || action.includes("add")) {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    }
    if (action.includes("update") || action.includes("replace") || action.includes("override")) {
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    }
    if (action.includes("delete") || action.includes("remove")) {
      return "border-red-500/20 bg-red-500/10 text-red-300";
    }
    return "border-white/10 bg-white/5 text-slate-300";
  }

  function buildPageUrl(overrides: Record<string, string>) {
    const sp = new URLSearchParams();
    if (params.action) sp.set("action", params.action);
    if (params.entityType) sp.set("entityType", params.entityType);
    if (params.orgId) sp.set("orgId", params.orgId);
    if (params.userId) sp.set("userId", params.userId);
    Object.entries(overrides).forEach(([k, v]) => sp.set(k, v));
    return `/admin/audit?${sp.toString()}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Audit & Activity</h1>
          <p className="mt-3 text-slate-400">Review recent administrative actions and timeline events. ({total} total)</p>
        </div>
        <Link href="/admin" className="cyber-button-secondary">Back to Admin</Link>
      </div>

      <section className="rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-6 backdrop-blur-md">
        <h2 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">Filters</h2>
        <form action="/admin/audit" className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <select name="action" defaultValue={params.action ?? ""}
            className="rounded-md border border-white/10 bg-[#0A1118]/60 px-3 py-3 text-sm text-slate-50 outline-none focus:border-emerald-600">
            <option value="">All Actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="entityType" defaultValue={params.entityType ?? ""}
            className="rounded-md border border-white/10 bg-[#0A1118]/60 px-3 py-3 text-sm text-slate-50 outline-none focus:border-emerald-600">
            <option value="">All Entity Types</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input name="userId" defaultValue={params.userId ?? ""} placeholder="User ID" className="cyber-input" />
          <input name="orgId" defaultValue={params.orgId ?? ""} placeholder="Org ID" className="cyber-input" />
          <button type="submit" className="cyber-button">Apply Filters</button>
        </form>
        <div className="mt-4 flex gap-3">
          <a href={`/api/v1/audit/export?format=csv&action=${params.action ?? ""}&entity_type=${params.entityType ?? ""}&organization_id=${params.orgId ?? ""}&actor_user_id=${params.userId ?? ""}`}
            className="cyber-button-secondary text-xs">Download CSV</a>
          <a href={`/api/v1/audit/export?format=json&action=${params.action ?? ""}&entity_type=${params.entityType ?? ""}&organization_id=${params.orgId ?? ""}&actor_user_id=${params.userId ?? ""}`}
            className="cyber-button-secondary text-xs">Download JSON</a>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-orbitron text-lg uppercase tracking-[0.12em] text-slate-50">Recent Events</h2>

        {logs.length > 0 ? logs.map((log: any) => {
          const org = log.organization_id ? orgMap.get(log.organization_id) : null;
          const actor = log.actor_user_id ? profileMap.get(log.actor_user_id) : null;
          return (
            <div key={log.id} className="rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-6 backdrop-blur-md">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none ${actionBadge(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-500">{log.entity_type}</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Actor: {actor?.full_name ?? actor?.email ?? log.actor_type ?? "System"}
                    {actor ? ` (${actor.email})` : ""}
                  </p>
                  <p className="text-sm text-slate-400">
                    Org: {org?.name ?? log.organization_id ?? "Global"}
                    {log.entity_id ? ` • ID: ${log.entity_id}` : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 ? (
                <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-[#0A1118]/60 p-4 text-xs text-slate-300 max-h-48 overflow-y-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              ) : null}
            </div>
          );
        }) : (
          <div className="rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-6 text-slate-400 backdrop-blur-md">
            No audit logs found for the selected filters.
          </div>
        )}
      </section>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          {currentPage > 1 ? <Link href={buildPageUrl({ page: String(currentPage - 1) })} className="cyber-button-secondary">Previous</Link> : null}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={buildPageUrl({ page: String(p) })}
              className={`px-3 py-2 text-sm rounded-md transition ${p === currentPage ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}>
              {p}
            </Link>
          ))}
          {currentPage < totalPages ? <Link href={buildPageUrl({ page: String(currentPage + 1) })} className="cyber-button-secondary">Next</Link> : null}
        </div>
      ) : null}
    </div>
  );
}

