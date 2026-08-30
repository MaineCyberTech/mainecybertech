import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "UniFi Site Surveys - Portal - Maine CyberTech" };

export default async function PortalUnifiSurveysPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fieldServices.unifi.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="UniFi Site Surveys">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "UniFi Site Surveys" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">UniFi Site Surveys</h1>
      <p className="text-sm text-slate-400">
        {items.length} site survey{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.site_name || "Site")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            {a.site_address != null && (
              <p className="mt-1 text-xs text-slate-400">{String(a.site_address)}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              APs: {String(a.access_points ?? "N/A")} &bull; Switches: {String(a.switches ?? "N/A")}{" "}
              &bull; Cameras: {String(a.cameras ?? "N/A")} &bull; Outdoor APs:{" "}
              {String(a.outdoor_aps ?? "N/A")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Cable runs: {String(a.cable_runs_estimated ?? "N/A")} &bull; PoE budget:{" "}
              {a.poe_budget_watts != null ? `${String(a.poe_budget_watts)} W` : "N/A"} &bull; NVR
              storage:{" "}
              {a.nvr_estimated_storage_tb != null
                ? `${String(a.nvr_estimated_storage_tb)} TB`
                : "N/A"}
            </p>
            {(a.survey_date as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Survey date: {new Date(String(a.survey_date)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No site surveys available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
