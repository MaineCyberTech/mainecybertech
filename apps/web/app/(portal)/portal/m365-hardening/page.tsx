import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { M365HardeningRecord } from "@mct/sdk";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "M365 Security - Portal - Maine CyberTech" };

export default async function PortalM365HardeningPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: M365HardeningRecord[] = [];
  try {
    const r = await api.securitySuite.m365.list({ organizationId: orgId });
    items = r.items as M365HardeningRecord[];
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="M365 Security">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "M365 Security" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">M365 Security</h1>
      <p className="text-sm text-slate-400">
        {items.length} tenant hardening check{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{a.tenant_domain}</p>
              <StatusPill status={a.status} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              MFA: {a.mfa_enforced ? "✅" : "❌"} &bull; CA:{" "}
              {a.conditional_access_configured ? "✅" : "❌"} &bull; Legacy Auth Blocked:{" "}
              {a.legacy_auth_blocked ? "✅" : "❌"}
            </p>
            {a.overall_score !== null && (
              <p className="mt-1 text-xs text-slate-400">Score: {a.overall_score}%</p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No M365 hardening checks available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
