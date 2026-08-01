import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateM365 } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "M365 Hardening Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.securitySuite.m365.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "M365", href: "/admin/m365-hardening" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="m365-hardening" />}
      title={String(record?.tenant_domain ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "tenantDomain", label: "Tenant" },
          { key: "mfaEnforced", label: "MFA", type: "checkbox" },
          { key: "conditionalAccessConfigured", label: "CA", type: "checkbox" },
          { key: "legacyAuthBlocked", label: "Legacy Blocked", type: "checkbox" },
          { key: "overallScore", label: "Score", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateM365}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/m365-hardening"
        parentLabel="M365"
      />
    </AdminPageShell>
  );
}
