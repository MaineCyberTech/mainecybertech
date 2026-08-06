import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "DNS Changes - Portal - Maine CyberTech" };

export default async function DnsChangesPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.dnsChanges.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="DNS Changes">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "DNS Changes" }]}
      />
      <PortalSubnav current="dns-changes" />
      <h1 className="text-2xl font-semibold text-slate-50">DNS Change Requests</h1>
      <p className="text-sm text-slate-400">
        {items.length} change request{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.domain || "Untitled")}</p>
            {item.change_description != null && (
              <p className="mt-1 text-xs text-slate-400">{String(item.change_description)}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.change_type != null && <span>Type: {String(item.change_type)}</span>}
              {item.proposed_value != null && <span>Proposed: {String(item.proposed_value)}</span>}
              {item.status != null && (
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    String(item.status) === "completed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : String(item.status) === "pending"
                        ? "bg-amber-500/20 text-amber-400"
                        : String(item.status) === "approved"
                          ? "bg-sky-500/20 text-sky-400"
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
          <p className="text-sm text-slate-400">No DNS change requests found.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
