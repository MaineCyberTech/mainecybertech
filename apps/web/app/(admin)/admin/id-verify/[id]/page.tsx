import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateIdVerify } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    const items = (await api.securitySuite.idVerify.list({})).items as unknown as Array<
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
            { label: "ID Verify", href: "/admin/id-verify" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="id-verify" />}
      title={String(record?.requestor_name ?? "Record Detail")}
    >
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
        }}
        parentHref="/admin/id-verify"
        parentLabel="ID Verify"
      />
    </AdminPageShell>
  );
}
