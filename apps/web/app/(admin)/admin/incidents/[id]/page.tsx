import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateIncident } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Incident Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.securitySuite.incidents.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Incidents", href: "/admin/incidents" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="incidents" />}
      title={String(record?.title ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "title", label: "Title" },
          { key: "incidentType", label: "Type" },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: ["low", "medium", "high", "critical"],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["detected", "contained", "eradicated", "recovered", "closed"],
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "affectedSystems", label: "Affected Systems", type: "textarea" },
          { key: "rootCause", label: "Root Cause", type: "textarea" },
          { key: "lessonsLearned", label: "Lessons Learned", type: "textarea" },
        ]}
        updateAction={updateIncident}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/incidents"
        parentLabel="Incidents"
      />
    </AdminPageShell>
  );
}
