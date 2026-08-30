import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateOnboarding, deleteOnboarding } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Onboarding Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.clientOnboarding.get(id)) as unknown as Record<string, unknown>;
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
          { key: "clientDomain", label: "Domain" },
          { key: "clientContactEmail", label: "Email" },
          { key: "clientContactPhone", label: "Phone" },
          { key: "status", label: "Status" },
          { key: "phase", label: "Phase" },
          { key: "riskLevel", label: "Risk" },
          { key: "m365SetupStatus", label: "M365 Setup" },
          { key: "m365TenantId", label: "M365 Tenant" },
          { key: "accessCollectionStatus", label: "Access Collection" },
          { key: "networkBaselineStatus", label: "Network Baseline" },
          { key: "documentationStatus", label: "Documentation" },
          { key: "securityBaselineStatus", label: "Security Baseline" },
          { key: "securityBaselineScore", label: "Security Score" },
          { key: "supportHandoffStatus", label: "Support Handoff" },
          { key: "supportHandoffNotes", label: "Handoff Notes", type: "textarea" },
          { key: "discoveryNotes", label: "Discovery Notes", type: "textarea" },
        ]}
        updateAction={updateOnboarding}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/onboarding/${id}`);
        }}
        deleteAction={deleteOnboarding}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/onboarding");
        }}
        parentHref="/admin/onboarding"
        parentLabel="Onboarding"
      />
    </AdminPageShell>
  );
}
