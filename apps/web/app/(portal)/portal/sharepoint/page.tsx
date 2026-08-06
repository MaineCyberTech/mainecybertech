import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "SharePoint & Teams - Portal - Maine CyberTech" };

export default async function SharePointPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.sharepoint.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="SharePoint & Teams">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "SharePoint & Teams" }]}
      />
      <PortalSubnav current="sharepoint" />
      <h1 className="text-2xl font-semibold text-slate-50">SharePoint &amp; Teams</h1>
      <p className="text-sm text-slate-400">
        {items.length} configuration{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.site_name || "Untitled")}</p>
            {item.team_name != null && (
              <p className="mt-1 text-xs text-slate-400">Team: {String(item.team_name)}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.structure_type != null && <span>Structure: {String(item.structure_type)}</span>}
              {item.external_sharing != null && (
                <span>External sharing: {String(item.external_sharing)}</span>
              )}
              {item.sensitivity_label != null && (
                <span>Label: {String(item.sensitivity_label)}</span>
              )}
              {item.status != null && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    String(item.status) === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : String(item.status) === "planned"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {String(item.status)}
                </span>
              )}
              {item.created_at != null && (
                <span>Created: {new Date(String(item.created_at)).toISOString().slice(0, 10)}</span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No SharePoint configurations found.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
