import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateIdVerify, deleteIdVerify } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";
import DataErrorNote from "@/components/admin/DataErrorNote";

export const dynamic = "force-dynamic";
export const metadata = { title: "ID Verify Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  let loadFailed = false;
  try {
    record = (await withRetry(() => api.securitySuite.idVerify.get(id))) as unknown as Record<
      string,
      unknown
    >;
  } catch (error) {
    console.error("[[id]/page]", error);
    loadFailed = true;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "ID Verify", href: "/admin/id-verify" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="id-verify" />}
      title={String(record?.requestor_name ?? "Record Detail")}
    >
      {loadFailed && <DataErrorNote what="data" />}
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "requestorName", label: "Requestor" },
          { key: "verificationMethod", label: "Method" },
          { key: "actionAuthorized", label: "Action" },
          { key: "verificationPass", label: "Passed", type: "checkbox" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateIdVerify}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/id-verify/${id}`);
        }}
        deleteAction={deleteIdVerify}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/id-verify");
        }}
        parentHref="/admin/id-verify"
        parentLabel="ID Verify"
      />
    </AdminPageShell>
  );
}
