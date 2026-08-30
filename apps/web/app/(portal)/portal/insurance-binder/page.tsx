import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insurance Evidence - Portal - Maine CyberTech" };

export default async function PortalInsuranceBinderPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.insuranceBinder.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

  const statusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "verified") return "bg-emerald-500/10 text-emerald-400";
    if (s === "pending") return "bg-amber-500/10 text-amber-400";
    if (s === "expired") return "bg-red-500/10 text-red-400";
    return "bg-white/5 text-slate-400";
  };

  return (
    <div className="space-y-6" role="region" aria-label="Insurance Evidence">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Insurance Evidence" }]}
      />
      <PortalSubnav current="insurance-binder" />
      <h1 className="text-2xl font-semibold text-slate-50">Insurance Evidence</h1>
      <p className="text-sm text-slate-400">
        View evidence collected for your cyber insurance coverage.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((e) => (
          <div
            key={String(e.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(e.title)}</p>
            <p className="mt-1 text-xs text-slate-400">{String(e.coverage_area || "General")}</p>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(String(e.status || "pending"))}`}
              >
                {String(e.status || "Pending")}
              </span>
              {e.expiry_date ? (
                <span className="text-xs text-slate-500">
                  Expires {new Date(String(e.expiry_date)).toISOString().slice(0, 10)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No evidence items found.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
