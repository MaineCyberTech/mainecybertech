import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateVendorContract } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

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
          { key: "renewalDate", label: "Renewal", type: "date" },
          { key: "endDate", label: "End Date", type: "date" },
          { key: "contractValue", label: "Value", type: "number" },
          { key: "autoRenews", label: "Auto-Renew", type: "checkbox" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateVendorContract}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/vendor-contracts"
        parentLabel="Contracts"
      />
    </AdminPageShell>
  );
}
