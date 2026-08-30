import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Data Retention - Portal - Maine CyberTech" };

export default async function PortalDataRetentionPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.governance.retention.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Data Retention">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Data Retention" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Data Retention Policies</h1>
      <p className="text-sm text-slate-400">
        {items.length} retention polic{items.length !== 1 ? "ies" : "y"} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div
            key={String(a.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{String(a.data_category || "Category")}</p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              System: {String(a.system_name || "N/A")} &bull; Retention:{" "}
              {String(a.retention_period_days ?? "N/A")} days &bull; Disposal:{" "}
              {String(a.disposal_method || "N/A")}
            </p>
            {a.is_regulated != null && (
              <p className="mt-1 text-xs text-slate-400">
                Regulated: {a.is_regulated ? "Yes" : "No"}
                {a.is_regulated && a.regulation_reference
                  ? ` (${String(a.regulation_reference)})`
                  : ""}
              </p>
            )}
            {(a.next_review_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Next review: {new Date(String(a.next_review_at)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No retention policies available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
