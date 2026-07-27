import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budget Roadmap - Portal - Maine CyberTech" };

const fmtCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default async function PortalBudgetsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.budgets.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  function priorityBadge(priority: string) {
    const p = priority.toLowerCase();
    if (p === "high" || p === "critical")
      return (
        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
          {priority}
        </span>
      );
    if (p === "medium")
      return (
        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
          {priority}
        </span>
      );
    return (
      <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs text-slate-400">
        {priority}
      </span>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-label="Budget Roadmap">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Budget Roadmap" }]}
      />
      <PortalSubnav current="budgets" />
      <h1 className="text-2xl font-semibold text-slate-50">Budget Roadmap</h1>
      <p className="text-sm text-slate-400">{items.length} budget items for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(item.item_name)}</p>
                <p className="mt-1 text-xs text-slate-400">Category: {String(item.category)}</p>
                {item.estimated_cost != null ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Est. Cost: {fmtCurrency.format(Number(item.estimated_cost))}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-slate-400">
                  FY{item.fiscal_year != null ? String(item.fiscal_year) : "—"} / Q
                  {item.quarter != null ? String(item.quarter) : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Created: {new Date(String(item.created_at)).toISOString().slice(0, 10)}
                </p>
              </div>
              {priorityBadge(String(item.priority))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No budget items found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
