"use client";

import { useRouter } from "next/navigation";

type Org = { id: string; name: string };

type Props = {
  orgs: Org[];
  activeOrgId: string;
  setActiveOrgAction: (orgId: string) => Promise<void>;
};

export default function OrgSwitcher({ orgs, activeOrgId, setActiveOrgAction }: Props) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const orgId = e.target.value;
    if (!orgId) return;
    await setActiveOrgAction(orgId);
    router.refresh();
  }

  if (orgs.length <= 1) return null;

  return (
    <select
      value={activeOrgId}
      onChange={handleChange}
      className="max-w-[160px] truncate rounded-lg border border-white/10 bg-[#0A1118]/80 px-2 py-1.5 text-[11px] text-slate-200 outline-none transition focus:border-emerald-600 sm:max-w-[200px] sm:px-3 sm:py-2 sm:text-xs"
    >
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
