import { getApiClient } from "@/lib/api";
import { notFound } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateLicense, deleteLicense } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `License Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  const items = (await api.batch.licenses.list({})).items as unknown as Array<
    Record<string, unknown>
  >;
  const record = items.find((r) => r.id === id) ?? null;
  if (!record) notFound();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Licenses", href: "/admin/licenses" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="licenses" />}
      title={String(record?.product_name ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "vendor", label: "Vendor" },
          { key: "productName", label: "Product" },
          { key: "totalSeats", label: "Total Seats", type: "number" },
          { key: "assignedSeats", label: "Assigned", type: "number" },
          { key: "unusedSeats", label: "Unused", type: "number" },
          { key: "costPerSeat", label: "Cost/Seat", type: "number" },
          { key: "annualCost", label: "Annual Cost", type: "number" },
          { key: "renewalDate", label: "Renewal", type: "date" },
          { key: "optimizationNotes", label: "Notes", type: "textarea" },
        ]}
        updateAction={updateLicense}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/licenses/${id}`);
        }}
        deleteAction={deleteLicense}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/licenses");
        }}
        parentHref="/admin/licenses"
        parentLabel="Licenses"
      />
    </AdminPageShell>
  );
}
