import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateOffboarding } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offboarding Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.securityOps.offboarding.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Offboarding", href: "/admin/offboarding" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="offboarding" />}
      title={String(record?.employee_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "employeeName", label: "Employee" },
          { key: "employeeEmail", label: "Email" },
          { key: "department", label: "Dept" },
          { key: "offboardingDate", label: "Date", type: "date" },
          { key: "accountDisabled", label: "Disabled", type: "checkbox" },
          { key: "mailboxConverted", label: "Mailbox", type: "checkbox" },
          { key: "onedriveTransferred", label: "OneDrive", type: "checkbox" },
          { key: "licenseReclaimed", label: "License", type: "checkbox" },
          { key: "accessReviewed", label: "Access", type: "checkbox" },
          { key: "evidenceCollected", label: "Evidence", type: "checkbox" },
        ]}
        updateAction={updateOffboarding}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/offboarding"
        parentLabel="Offboarding"
      />
    </AdminPageShell>
  );
}
