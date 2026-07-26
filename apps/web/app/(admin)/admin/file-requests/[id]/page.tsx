import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateFileRequest } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.fileRequests.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "File Requests", href: "/admin/file-requests" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="file-requests" />}
      title={String(record?.title ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "token", label: "Token" },
          { key: "expiresAt", label: "Expires" },
          { key: "maxFileSizeMb", label: "Max Size (MB)", type: "number" },
          { key: "maxFiles", label: "Max Files", type: "number" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["active", "completed", "expired", "revoked"],
          },
        ]}
        updateAction={updateFileRequest}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/file-requests"
        parentLabel="File Requests"
      />
    </AdminPageShell>
  );
}
