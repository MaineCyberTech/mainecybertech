import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Endpoint Security - Portal - Maine CyberTech" };

export default async function PortalEndpointSecurityPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.securitySuite.endpoints.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Endpoint Security">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Endpoint Security" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Endpoint Security</h1>
      <p className="text-sm text-slate-400">
        {items.length} endpoint{items.length !== 1 ? "s" : ""} monitored for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => {
          const total = Number(a.total_endpoints ?? 0);
          const av = Number(a.av_installed ?? 0);
          const enc = Number(a.disk_encrypted ?? 0);
          const mdm = Number(a.mdm_enrolled ?? 0);
          return (
            <div
              key={String(a.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{String(a.device_group || "Group")}</p>
                <StatusPill status={String(a.status || "unknown")} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Total endpoints: {String(total)} &bull; AV: {String(av)} &bull; Encrypted:{" "}
                {String(enc)} &bull; MDM: {String(mdm)}
              </p>
              {a.coverage_pct != null && (
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Number(a.coverage_pct))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Coverage: {String(a.coverage_pct)}%</p>
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No endpoints registered.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
