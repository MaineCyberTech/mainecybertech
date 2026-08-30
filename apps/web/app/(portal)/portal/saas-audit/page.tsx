import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "SaaS Audit - Portal - Maine CyberTech" };

export default async function SaasAuditPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.saasAudit.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="SaaS Audit">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "SaaS Audit" }]}
      />
      <PortalSubnav current="saas-audit" />
      <h1 className="text-2xl font-semibold text-slate-50">SaaS Subscription Audit</h1>
      <p className="text-sm text-slate-400">
        {items.length} subscription{items.length !== 1 ? "s" : ""} tracked for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.vendor_name ?? "Unknown")}</p>
            {item.service_name != null && (
              <p className="mt-1 text-xs text-slate-400">{String(item.service_name)}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.monthly_cost != null && (
                <span>
                  Cost:{" "}
                  {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    Number(item.monthly_cost),
                  )}
                </span>
              )}
              {item.annual_cost != null && (
                <span>
                  Annual:{" "}
                  {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                    Number(item.annual_cost),
                  )}
                </span>
              )}
              {item.classification != null && (
                <span>Classification: {String(item.classification)}</span>
              )}
              {item.renewal_date != null && (
                <span>
                  Renewal: {new Date(String(item.renewal_date)).toISOString().slice(0, 10)}
                </span>
              )}
              {item.cancellation_risk != null && (
                <span>Risk: {String(item.cancellation_risk)}</span>
              )}
              {item.has_data_access != null && (
                <span>Data Access: {item.has_data_access ? "Yes" : "No"}</span>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No SaaS subscriptions found.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
