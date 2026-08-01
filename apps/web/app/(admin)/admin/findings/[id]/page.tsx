import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateFinding } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Finding Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.findings.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Findings", href: "/admin/findings" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="findings" />}
      title={String(record?.title ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "severity", label: "Severity", type: "select", options: ["p0", "p1", "p2", "p3"] },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["open", "in_progress", "resolved", "verified", "closed", "wont_fix"],
          },
          { key: "source", label: "Source" },
          { key: "remediationPlan", label: "Remediation Plan", type: "textarea" },
          { key: "remediationDeadline", label: "Deadline", type: "date" },
          { key: "findingCategory", label: "Category" },
          { key: "affectedSystems", label: "Affected Systems", type: "textarea" },
        ]}
        updateAction={updateFinding}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/findings"
        parentLabel="Findings"
      />
    </AdminPageShell>
  );
}
