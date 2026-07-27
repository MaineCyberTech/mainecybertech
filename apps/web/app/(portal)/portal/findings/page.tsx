import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import { SeverityPill } from "@/components/admin/SeverityPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Findings - Portal - Maine CyberTech" };

export default async function PortalFindingsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.findings.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  let isAdmin = false;
  try {
    await requireAdminAccess();
    isAdmin = true;
  } catch {
    isAdmin = false;
  }

  return (
    <div className="space-y-6" role="region" aria-label="Findings">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Findings" }]} />
      <PortalSubnav current="findings" />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-50">Findings &amp; Remediation</h1>
        {isAdmin ? (
          <Link href="/admin/findings" className="cyber-button-secondary">
            View in Admin
          </Link>
        ) : null}
      </div>
      <p className="text-sm text-slate-400">
        {items.length} findings tracked for your organization.
      </p>
      <div className="space-y-3">
        {items.map((f) => (
          <div key={String(f.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(f.title)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Source: {String(f.source)} &bull; Status: {String(f.status)}
                </p>
                {(f.description as string | null) && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {String(f.description)}
                  </p>
                )}
              </div>
              <SeverityPill severity={String(f.severity)} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No findings reported.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
