import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import LinkedRunbook from "@/components/runbooks/LinkedRunbook";
import { updateIncident, deleteIncident } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";
import DataErrorNote from "@/components/admin/DataErrorNote";

export const dynamic = "force-dynamic";
export const metadata = { title: "Incident Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  let loadFailed = false;
  try {
    record = (await withRetry(() => api.securitySuite.incidents.get(id))) as unknown as Record<
      string,
      unknown
    >;
  } catch (error) {
    console.error("[[id]/page]", error);
    loadFailed = true;
  }

  let linkedRunbook: {
    title: string;
    category?: string | null;
    version?: string | null;
    content?: string | null;
  } | null = null;
  const runbookId = record?.runbook_id as string | null | undefined;
  if (runbookId) {
    try {
      linkedRunbook = (await withRetry(() =>
        api.final.runbooks.get(runbookId),
      )) as unknown as typeof linkedRunbook;
    } catch (error) {
      console.error("[[id]/page] runbook", error);
    }
  }

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
      {loadFailed && <DataErrorNote what="data" />}
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
          { key: "runbookId", label: "Response Runbook ID", placeholder: "Runbook UUID" },
        ]}
        updateAction={updateIncident}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/incidents/${id}`);
        }}
        deleteAction={deleteIncident}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/incidents");
        }}
        parentHref="/admin/incidents"
        parentLabel="Incidents"
      />
      <div className="mt-4">
        <LinkedRunbook runbook={linkedRunbook} />
      </div>
    </AdminPageShell>
  );
}
