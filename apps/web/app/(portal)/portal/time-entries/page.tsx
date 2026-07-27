import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Time Entries - Portal - Maine CyberTech" };

export default async function PortalTimeEntriesPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.timeEntries.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Time Entries">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Time Entries" }]}
      />
      <PortalSubnav current="time-entries" />
      <h1 className="text-2xl font-semibold text-slate-50">Time Entries</h1>
      <p className="text-sm text-slate-400">{items.length} time entries for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.description)}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
              {item.hours != null ? <span>{Number(item.hours).toFixed(1)}h</span> : null}
              {item.work_date ? (
                <span>Date: {new Date(String(item.work_date)).toISOString().slice(0, 10)}</span>
              ) : null}
              {item.ticket_id ? <span>Ticket: {String(item.ticket_id).slice(0, 8)}</span> : null}
              <span>
                {item.billable ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                    Billable
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-slate-400">
                    Non-billable
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No time entries found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
