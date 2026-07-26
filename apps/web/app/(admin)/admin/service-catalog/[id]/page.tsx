import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateService } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.serviceCatalog.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Services", href: "/admin/service-catalog" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="service-catalog" />}
      title={String(record?.name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "name", label: "Name" },
          { key: "description", label: "Description", type: "textarea" },
          { key: "category", label: "Category" },
          { key: "basePrice", label: "Price", type: "number" },
          { key: "unit", label: "Unit" },
          { key: "billingModel", label: "Billing Model" },
          { key: "isBundled", label: "Bundled", type: "checkbox" },
          { key: "isActive", label: "Active", type: "checkbox" },
        ]}
        updateAction={updateService}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/service-catalog"
        parentLabel="Services"
      />
    </AdminPageShell>
  );
}
