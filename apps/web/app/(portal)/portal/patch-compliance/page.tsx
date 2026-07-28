import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Patch Compliance - Portal - Maine CyberTech" };

export default async function PortalPatchCompliancePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.securityOps.patchCompliance.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Patch Compliance">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Patch Compliance" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Patch Compliance</h1>
      <p className="text-sm text-slate-400">
        {items.length} device{items.length !== 1 ? "s" : ""} tracked for patch compliance.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={String(a.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">
                {String(a.name || a.device_name || a.hostname || "")}
              </p>
              <StatusPill status={String(a.compliance_status || a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Patches pending: {String(a.patches_pending ?? "N/A")} &bull; Critical:{" "}
              {String(a.critical_patches ?? "N/A")}
            </p>
            {(a.last_patched as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Last patched: {new Date(String(a.last_patched)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No patch compliance data available.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
