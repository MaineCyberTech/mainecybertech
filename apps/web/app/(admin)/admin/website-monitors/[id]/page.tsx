import { getApiClient } from "@/lib/api";
import { notFound } from "next/navigation";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateWebsiteMonitor, deleteWebsiteMonitor } from "@/lib/module-actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Website Monitor Detail (${id.slice(0, 8)}) - Admin - Maine CyberTech` };
}

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  const items = (await api.batch.websiteMonitors.list({})).items as unknown as Array<
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
            { label: "Websites", href: "/admin/website-monitors" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="website-monitors" />}
      title={String(record?.url ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "url", label: "URL" },
          { key: "displayName", label: "Display Name" },
          { key: "checkIntervalHours", label: "Check Interval (hrs)", type: "number" },
          { key: "alertsEnabled", label: "Alerts", type: "checkbox" },
        ]}
        updateAction={updateWebsiteMonitor}
        onUpdate={async () => {
          "use server";
          revalidatePath(`/admin/website-monitors/${id}`);
        }}
        deleteAction={deleteWebsiteMonitor}
        onDelete={async () => {
          "use server";
          revalidatePath("/admin/website-monitors");
        }}
        parentHref="/admin/website-monitors"
        parentLabel="Websites"
      />
    </AdminPageShell>
  );
}
