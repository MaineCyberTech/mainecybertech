import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createIncident } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Incidents" };
export default async function IncidentsPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    title: string;
    incident_type: string;
    severity: string;
    status: string;
    detected_at: string | null;
  }> = [];
  try {
    const r = await api.securitySuite.incidents.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }
  const sev = (s: string) =>
    ({ low: "slate", medium: "amber", high: "amber", critical: "red" })[s] || "slate";
  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Incidents" }]} />
      }
      subnav={<AdminSubnav current="incidents" />}
      title="Security Incident Response"
      description="Track incidents from detection through containment, eradication, and recovery."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "title", label: "Title", required: true },
          { key: "incidentType", label: "Type", required: true },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: ["low", "medium", "high", "critical"],
            required: true,
          },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        title="New Incident"
        action={createIncident}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((i) => (
              <div key={i.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between">
                  <Link
                    className="transition hover:text-emerald-400"
                    href={`/admin/incidents/${i.id}`}
                  >
                    <p className="font-medium text-slate-50">{i.title}</p>
                  </Link>
                  <span
                    className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] border-${sev(i.severity)}-500/25 bg-${sev(i.severity)}-500/10 text-${sev(i.severity)}-300`}
                  >
                    {i.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {i.incident_type} &bull; {i.severity} &bull; Detected:{" "}
                  {i.detected_at ? new Date(i.detected_at).toISOString().slice(0, 10) : "—"}
                </p>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🚨"
              title="No incidents"
              description="Report a security incident to begin the response workflow."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
