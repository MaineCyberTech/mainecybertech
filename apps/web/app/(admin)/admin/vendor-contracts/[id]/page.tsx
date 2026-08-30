import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateVendorContract, deleteVendorContract } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contract Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.vendors.contracts.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Contracts", href: "/admin/vendor-contracts" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="vendor-contracts" />}
      title={String(record?.vendor_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "vendorName", label: "Vendor" },
          { key: "serviceName", label: "Service" },
          { key: "contractNumber", label: "Contract #" },
          { key: "contractType", label: "Contract Type" },
          { key: "startDate", label: "Start Date", type: "date" },
          { key: "renewalDate", label: "Renewal", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "contractValue", label: "Value", type: "number" },
          { key: "autoRenews", label: "Auto-Renew", type: "checkbox" },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: ["active", "expiring", "expired", "cancelled"],
          },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateVendorContract}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/vendor-contracts/${id}`);
        }}
        deleteAction={deleteVendorContract}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/vendor-contracts");
        }}
        parentHref="/admin/vendor-contracts"
        parentLabel="Contracts"
      />
    </AdminPageShell>
  );
}
