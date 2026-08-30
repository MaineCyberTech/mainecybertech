import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateVendorContact, deleteVendorContact } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor Contact Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.vendors.contacts.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Contacts", href: "/admin/vendor-contacts" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="vendor-contacts" />}
      title={String(record?.vendor_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "vendorName", label: "Vendor" },
          { key: "contactName", label: "Contact" },
          { key: "roleTitle", label: "Role" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "supportPortalUrl", label: "Portal URL" },
          { key: "accountNumber", label: "Account #" },
          { key: "isPrimary", label: "Primary", type: "checkbox" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateVendorContact}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/vendor-contacts/${id}`);
        }}
        deleteAction={deleteVendorContact}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/vendor-contacts");
        }}
        parentHref="/admin/vendor-contacts"
        parentLabel="Contacts"
      />
    </AdminPageShell>
  );
}
