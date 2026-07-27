import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "License Optimizer - Portal - Maine CyberTech" };

export default async function PortalLicenseOptimizerPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = (await api.licenseOptimizer.list({ organizationId: orgId })) as any;
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="License Optimizer">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "License Optimizer" }]}
      />
      <PortalSubnav current="license-optimizer" />
      <h1 className="text-2xl font-semibold text-slate-50">License Optimizer</h1>
      <p className="text-sm text-slate-400">
        Review your software license utilization and identify potential savings.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((l) => {
          const used = Number(l.used_seats || 0);
          const total = Number(l.total_seats || 1);
          const pct = total > 0 ? Math.round((used / total) * 100) : 0;
          return (
            <div
              key={String(l.id)}
              className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-50">{String(l.software_name)}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {used} / {total} seats used
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    pct < 50
                      ? "bg-red-500/10 text-red-400"
                      : pct < 80
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {String(l.status || "Active")}
                </span>
              </div>
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-white/5">
                  <div
                    className={`h-1.5 rounded-full ${
                      pct < 50 ? "bg-red-500" : pct < 80 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">{pct}% utilization</p>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No license data available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
