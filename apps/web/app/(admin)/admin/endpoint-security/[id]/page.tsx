import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateEndpoint, deleteEndpoint } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Endpoint Security Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await withRetry(() => api.securitySuite.endpoints.get(id))) as unknown as Record<
      string,
      unknown
    >;
  } catch (error) {
    console.error("[[id]/page]", error);
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Endpoints", href: "/admin/endpoint-security" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="endpoint-security" />}
      title={String(record?.device_group ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "deviceGroup", label: "Device Group" },
          { key: "totalEndpoints", label: "Total", type: "number" },
          { key: "avInstalled", label: "AV", type: "number" },
          { key: "diskEncrypted", label: "Encrypted", type: "number" },
          { key: "mdmEnrolled", label: "MDM", type: "number" },
          { key: "coveragePct", label: "Coverage %", type: "number" },
        ]}
        updateAction={updateEndpoint}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/endpoint-security/${id}`);
        }}
        deleteAction={deleteEndpoint}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/endpoint-security");
        }}
        parentHref="/admin/endpoint-security"
        parentLabel="Endpoints"
      />
    </AdminPageShell>
  );
}
