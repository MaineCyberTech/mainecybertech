import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offboarding - Portal - Maine CyberTech" };

export default async function PortalOffboardingPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.securityOps.offboarding.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Offboarding">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Offboarding" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Offboarding</h1>
      <p className="text-sm text-slate-400">
        {items.length} offboarding record{items.length !== 1 ? "s" : ""} for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={String(a.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">
                {String(a.name || a.employee || a.user || "")}
              </p>
              <StatusPill status={String(a.status || "unknown")} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Department: {String(a.department || "N/A")} &bull; Offboard date:{" "}
              {String(
                a.offboard_date
                  ? new Date(String(a.offboard_date)).toISOString().slice(0, 10)
                  : "N/A",
              )}
            </p>
            {(a.completed_at as string | null) && (
              <p className="mt-1 text-xs text-slate-400">
                Completed: {new Date(String(a.completed_at)).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No offboarding records yet.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
