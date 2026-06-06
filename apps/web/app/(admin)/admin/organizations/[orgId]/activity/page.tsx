import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export const metadata = { title: "Organization Activity - Admin - Maine CyberTech" };

type OrgActivityPageProps = {
  params: Promise<{
    orgId: string;
  }>;
};

export default async function OrganizationActivityPage({
  params
}: OrgActivityPageProps) {
  await requireAdminAccess();
  const { orgId } = await params;
  const api = getApiClient();

  const [org, logsResult] = await Promise.all([
    api.organizations.get(orgId).catch(() => null),
    api.audit.list({ organizationId: orgId }),
  ]);
  const logs = logsResult.items ?? [];

  const userIds = [...new Set(logs.map((l: any) => l.actor_user_id).filter(Boolean))] as string[];

  const profiles = userIds.length > 0 ? await api.profiles.list({ ids: userIds }) : [];

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
            {org?.name ?? "Organization"} Activity
          </h1>
          <p className="mt-3 text-slate-400">
            Timeline of actions associated with this organization.
          </p>
        </div>

        <Link
          href={`/admin/organizations/${orgId}`}
          className="rounded-lg border-2 border-emerald-600 bg-transparent px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-emerald-500 transition-all hover:bg-emerald-600/10"
        >
          Back to Organization
        </Link>
      </div>

      <div className="space-y-4">
        {logs && logs.length > 0 ? (
          logs.map((log) => {
            const actor = log.actor_user_id ? profileMap.get(log.actor_user_id) : null;

            return (
              <div
                key={log.id}
                className="rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-6 backdrop-blur-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-slate-50">{log.action}</p>
                    <p className="text-sm text-slate-400">
                      Entity: {log.entity_type}
                      {log.entity_id ? ` • ${log.entity_id}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Actor: {actor?.full_name ?? actor?.email ?? log.actor_type}
                    </p>
                  </div>

                  <div className="text-right text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>

                {log.metadata ? (
                  <pre className="mt-4 overflow-x-auto rounded-md border border-white/10 bg-[#0A1118]/60 p-4 text-xs text-slate-300">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-6 text-slate-400 backdrop-blur-md">
            No activity found for this organization.
          </div>
        )}
      </div>
    </div>
  );
}