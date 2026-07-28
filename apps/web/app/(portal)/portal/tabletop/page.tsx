import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tabletop Exercises - Portal - Maine CyberTech" };

export default async function PortalTabletopPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.governance.tabletop.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Tabletop Exercises">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Tabletop Exercises" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Tabletop Exercises</h1>
      <p className="text-sm text-slate-400">
        {items.length} tabletop exercise{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={String(a.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.title || a.name || "")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Scenario: {String(a.scenario || "N/A")} &bull; Participants:{" "}
              {String(a.participants ?? "N/A")}
            </p>
            {(a.scheduled_date as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Scheduled: {new Date(String(a.scheduled_date)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No tabletop exercises scheduled.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
