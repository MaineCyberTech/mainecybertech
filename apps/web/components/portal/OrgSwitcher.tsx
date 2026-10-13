"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SetActiveOrgResult } from "@/lib/org-actions";

type Org = { id: string; name: string };

type Props = {
  orgs: Org[];
  activeOrgId: string;
  setActiveOrgAction: (orgId: string) => Promise<SetActiveOrgResult>;
};

export default function OrgSwitcher({ orgs, activeOrgId, setActiveOrgAction }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const orgId = e.target.value;
    if (!orgId) return;
    const result = await setActiveOrgAction(orgId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    router.refresh();
  }

  if (orgs.length <= 1) return null;

  return (
    <div className="flex flex-col gap-1">
      <select
        value={activeOrgId}
        onChange={handleChange}
        aria-label="Switch organization"
        className="max-w-[160px] truncate rounded-lg border border-white/10 bg-cyber-base/80 px-2 py-1.5 text-[11px] text-slate-200 outline-none transition focus:border-emerald-600 sm:max-w-[200px] sm:px-3 sm:py-2 sm:text-xs"
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      {error ? (
        <p role="alert" className="max-w-[200px] text-[10px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
