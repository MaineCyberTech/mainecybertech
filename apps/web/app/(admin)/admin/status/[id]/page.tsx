import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateStatusItem, deleteStatusItem } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    const items = (await api.batch.status.list({})).items as unknown as Array<
      Record<string, unknown>
    >;
    record = items.find((r) => r.id === id) ?? null;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Status", href: "/admin/status" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="status" />}
      title={String(record?.title ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "title", label: "Title" },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: ["info", "warning", "critical", "maintenance"],
          },
          { key: "description", label: "Description", type: "textarea" },
          { key: "isPublic", label: "Public", type: "checkbox" },
          { key: "isResolved", label: "Resolved", type: "checkbox" },
        ]}
        updateAction={updateStatusItem}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/status/${id}`);
        }}
        deleteAction={deleteStatusItem}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/status");
        }}
        parentHref="/admin/status"
        parentLabel="Status"
      />
    </AdminPageShell>
  );
}
