import { getApiClient } from "@/lib/api";

type PermissionsMatrixProps = {
  userId: string;
  memberships: any[];
};

export default async function PermissionsMatrix({ userId }: PermissionsMatrixProps) {
  let data: any;
  try {
    const api = getApiClient();
    data = await api.users.getPermissions(userId);
  } catch {
    return <div className="mt-4 text-sm text-red-400">Failed to load permissions.</div>;
  }

  if (!data || !data.permissions?.length) {
    return <div className="mt-4 text-sm text-slate-400">No permissions configured.</div>;
  }

  const { permissions, memberships: userMemberships, rolePermissionIds, overrides } = data;
  const modules: string[] = [...new Set<string>(permissions.map((p: any) => p.module_key))];
  const actions: string[] = [...new Set<string>(permissions.map((p: any) => p.action_key))];

  const permMap = new Map<string, any>(permissions.map((p: any) => [`${p.module_key}:${p.action_key}`, p]));

  return (
    <div className="mt-6 overflow-x-auto">
      {(userMemberships ?? []).map((membership: any) => {
        const role = membership.roles;
        const org = membership.organizations;
        return (
          <div key={membership.id} className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">
              {org?.name ?? "Unknown Org"} — {role?.name ?? "Unknown Role"}
            </h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-xs uppercase tracking-[0.12em] text-slate-500">Module</th>
                  {actions.map((action: string) => (
                    <th key={action} className="px-3 py-2 text-center text-xs uppercase tracking-[0.12em] text-slate-500">{action}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module: string) => (
                  <tr key={module} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-medium text-slate-200 capitalize">{module}</td>
                    {actions.map((action: string) => {
                      const perm = permMap.get(`${module}:${action}`);
                      const hasRolePermission = perm && rolePermissionIds?.includes(perm.id);
                      const override = perm && overrides?.find((o: any) =>
                        o.permission_id === perm.id && o.organization_id === membership.organization_id
                      );

                      let bg = "bg-slate-800/30";
                      let indicator = "—";
                      if (override) {
                        bg = override.is_allowed ? "bg-emerald-500/15" : "bg-red-500/15";
                        indicator = override.is_allowed ? "✓" : "✗";
                      } else if (hasRolePermission) {
                        bg = "bg-emerald-500/10";
                        indicator = "✓";
                      }

                      return (
                        <td key={action} className={`px-3 py-2 text-center text-xs ${bg}`}>
                          <span className={
                            hasRolePermission || override?.is_allowed
                              ? "text-emerald-400"
                              : override
                                ? "text-red-400"
                                : "text-slate-500"
                          }>
                            {indicator}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
