import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domain Monitors - Portal - Maine CyberTech" };

function Pill({ value }: { value: unknown }) {
  const active = value === true || value === "true";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
      }`}
    >
      {active ? "Yes" : "No"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "active"
      ? "bg-emerald-500/20 text-emerald-400"
      : status === "warning"
        ? "bg-amber-500/20 text-amber-400"
        : status === "error"
          ? "bg-red-500/20 text-red-400"
          : "bg-slate-500/20 text-slate-400";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

export default async function DomainMonitorsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.domainMonitors.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Domain Monitors">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Domain Monitors" }]}
      />
      <PortalSubnav current="domain-monitors" />
      <h1 className="text-2xl font-semibold text-slate-50">Domain Monitors</h1>
      <p className="text-sm text-slate-400">
        {items.length} monitor{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <div className="flex items-center gap-3">
              <p className="font-medium text-slate-50">{String(item.domain)}</p>
              {item.display_name != null && (
                <span className="text-xs text-slate-400">({String(item.display_name)})</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>
                SSL: <Pill value={item.ssl_valid} />
              </span>
              {item.ssl_expires != null && (
                <span>
                  SSL Expires: {new Date(String(item.ssl_expires)).toISOString().slice(0, 10)}
                </span>
              )}
              <span>SPF: {String(item.spf_status)}</span>
              <span>DKIM: {String(item.dkim_status)}</span>
              <span>DMARC: {String(item.dmarc_status)}</span>
              <span>
                Cloudflare: <Pill value={item.cloudflare_proxied} />
              </span>
            </div>
            <div className="mt-2">
              <StatusBadge status={String(item.status ?? "inactive")} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No domain monitors found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
