import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { IncidentRecord } from "@mct/sdk";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";
export const metadata = { title: "Incident Response - Portal - Maine CyberTech" };

export default async function PortalIncidentResponsePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: IncidentRecord[] = [];
  try {
    const r = await api.securitySuite.incidents.list({ organizationId: orgId });
    items = r.items as IncidentRecord[];
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Incident Response">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Incident Response" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Incident Response</h1>
      <p className="text-sm text-slate-400">
        {items.length} incident{items.length !== 1 ? "s" : ""} tracked for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-50">{a.title}</p>
              <StatusPill status={a.status} />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {a.incident_type} &bull; Severity: {a.severity}
            </p>
            {a.detected_at && (
              <p className="mt-1 text-xs text-slate-400">
                Detected: {new Date(a.detected_at).toISOString().slice(0, 10)}
              </p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No incidents recorded.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
