import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateOnboarding } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.securityOps.onboarding.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Onboarding", href: "/admin/onboarding" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="onboarding" />}
      title={String(record?.client_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "clientName", label: "Client" },
          { key: "discoveryComplete", label: "Discovery", type: "checkbox" },
          { key: "m365SetupComplete", label: "M365", type: "checkbox" },
          { key: "securityBaselineApplied", label: "Security", type: "checkbox" },
          { key: "handoffComplete", label: "Handoff", type: "checkbox" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateOnboarding}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/onboarding"
        parentLabel="Onboarding"
      />
    </AdminPageShell>
  );
}
