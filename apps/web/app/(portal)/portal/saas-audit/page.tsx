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
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="font-medium text-slate-50">
              {String(item.vendor ?? item.name ?? "Unknown")}
            </p>
            {item.description != null && (
              <p className="mt-1 text-xs text-slate-400">{String(item.description)}</p>
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
              {item.category != null && <span>Category: {String(item.category)}</span>}
              {item.status != null && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    String(item.status) === "active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : String(item.status) === "trial"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {String(item.status)}
                </span>
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
