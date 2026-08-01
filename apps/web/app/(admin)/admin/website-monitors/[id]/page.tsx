import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateWebsiteMonitor } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Website Monitor Detail - Admin - Maine CyberTech" };

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    const items = (await api.batch.websiteMonitors.list({})).items as unknown as Array<
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
        }}
        parentHref="/admin/website-monitors"
        parentLabel="Websites"
      />
    </AdminPageShell>
  );
}
