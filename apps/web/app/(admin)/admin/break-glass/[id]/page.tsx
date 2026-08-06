import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateBreakGlass, deleteBreakGlass } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Break Glass Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.securityOps.breakGlass.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Break Glass", href: "/admin/break-glass" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="break-glass" />}
      title={String(record?.account_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "accountName", label: "Account" },
          { key: "system", label: "System" },
          { key: "custodianName", label: "Custodian" },
          { key: "lastRotatedAt", label: "Last Rotated", type: "date" },
          { key: "nextRotationAt", label: "Next Rotation", type: "date" },
          { key: "accessProcedure", label: "Access Procedure", type: "textarea" },
          { key: "testNotes", label: "Test Notes", type: "textarea" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["active", "inactive", "expired"],
          },
        ]}
        updateAction={updateBreakGlass}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/break-glass/${id}`);
        }}
        deleteAction={deleteBreakGlass}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/break-glass");
        }}
        parentHref="/admin/break-glass"
        parentLabel="Break Glass"
      />
    </AdminPageShell>
  );
}
