"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getClientApi } from "@/lib/client-api";
import { setActiveOrg } from "@/lib/org-actions";
import { usePermissions } from "@/lib/use-permissions";

type Org = { id: string; name: string; status?: string };

// The admin "list all tenants" endpoint returns a paginated envelope
// ({ items, total, page, limit }); tolerate both that and a bare array.
function toOrgArray(result: unknown): Org[] {
  if (Array.isArray(result)) return result as Org[];
  const items = (result as { items?: unknown })?.items;
  if (Array.isArray(items)) return items as Org[];
  return [];
}

/**
 * Super-admin tenant switcher for the admin header. Lists every
 * organization so a super admin can inspect any tenant's instance
 * without losing their elevated privileges.
 */
export default function SuperAdminOrgSwitcher() {
  const router = useRouter();
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const [orgs, setOrgs] = useState<Org[] | null>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!isSuperAdmin || orgs) return;
    let cancelled = false;
    getClientApi()
      .organizations.listAll()
      .then((data) => {
        if (cancelled) return;
        const arr = toOrgArray(data);
        setOrgs(arr);
        if (arr.length && !arr.some((o) => o.id === value)) {
          setValue(arr[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setOrgs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, orgs, value]);

  if (permissionsLoading || !isSuperAdmin) return null;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const orgId = e.target.value;
    if (!orgId) return;
    setValue(orgId);
    await setActiveOrg(orgId);
    router.refresh();
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      aria-label="Switch active tenant (super admin)"
      title="Switch active tenant"
      className="max-w-[180px] truncate rounded-lg border border-purple-500/30 bg-cyber-base/80 px-2 py-1.5 text-[11px] text-purple-300 outline-none transition focus:border-purple-500 sm:max-w-[220px] sm:px-3 sm:py-2 sm:text-xs"
    >
      {!orgs || orgs.length === 0 ? (
        <option value="">No tenants</option>
      ) : (
        orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
            {org.status && org.status !== "active" ? ` (${org.status})` : ""}
          </option>
        ))
      )}
    </select>
  );
}
