import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateAsset } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.assets.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Assets", href: "/admin/assets" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="assets" />}
      title={String(record?.name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "name", label: "Name" },
          { key: "assetType", label: "Type" },
          { key: "make", label: "Make" },
          { key: "model", label: "Model" },
          { key: "serialNumber", label: "Serial" },
          { key: "assetTag", label: "Tag" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["active", "retired", "decommissioned", "lost", "repair"],
          },
          { key: "location", label: "Location" },
          { key: "purchaseDate", label: "Purchase Date", type: "date" },
          { key: "warrantyExpires", label: "Warranty Expires", type: "date" },
          { key: "lifecycleScore", label: "Score", type: "number" },
          { key: "maintenanceNotes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateAsset}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/assets"
        parentLabel="Assets"
      />
    </AdminPageShell>
  );
}
