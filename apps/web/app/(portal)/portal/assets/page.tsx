import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Assets - Portal - Maine CyberTech" };

export default async function PortalAssetsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.assets.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Assets">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Assets" }]} />
      <PortalSubnav current="assets" />
      <h1 className="text-2xl font-semibold text-slate-50">Assets</h1>
      <p className="text-sm text-slate-400">
        {items.length} hardware assets registered for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(a.name)}</p>
            <p className="mt-1 text-xs text-slate-400">
              {String(a.make || "")} {String(a.model || "")} &bull; {String(a.asset_type)} &bull;
              Status: {String(a.status)}
            </p>
            {(a.warranty_expires as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Warranty: {new Date(String(a.warranty_expires)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No assets registered.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
