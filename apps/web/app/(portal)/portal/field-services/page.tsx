import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Field Services - Portal - Maine CyberTech" };

export default async function FieldServicesPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fieldServices.isp.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Field Services">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Field Services" }]}
      />
      <PortalSubnav current="field-services" />
      <h1 className="text-2xl font-semibold text-slate-50">Field Services</h1>
      <p className="text-sm text-slate-400">
        {items.length} ISP assessment{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.client_name)}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>Provider: {String(item.current_provider || "N/A")}</span>
              <span>Bandwidth: {String(item.bandwidth_current || "N/A")}</span>
              <span>
                Monthly Cost:{" "}
                {Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  Number(item.current_cost ?? 0),
                )}
              </span>
              {item.contract_status != null && (
                <span>Contract: {String(item.contract_status)}</span>
              )}
              {Number(item.phone_lines ?? 0) > 0 && (
                <span>Phone Lines: {String(item.phone_lines)}</span>
              )}
            </div>
            <div className="mt-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  String(item.status) === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : String(item.status) === "expired"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {String(item.status)}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No ISP assessments found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
