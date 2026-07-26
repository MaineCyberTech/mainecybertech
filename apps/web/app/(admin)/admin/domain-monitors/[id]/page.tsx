import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import RecordDetail from "@/components/admin/RecordDetail";
import { updateDomainMonitor } from "@/lib/module-actions";

export const dynamic = "force-dynamic";

export default async function DetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireAdminAccess();
  const api = getApiClient();
  let record: Record<string, unknown> | null = null;
  try {
    record = (await api.domainMonitors.get(id)) as unknown as Record<string, unknown>;
  } catch {}

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Domain Monitor", href: "/admin/domain-monitors" },
            { label: "Detail" },
          ]}
        />
      }
      subnav={<AdminSubnav current="domain-monitors" />}
      title={String(record?.domain ?? "Record Detail")}
    >
      <RecordDetail
        id={id}
        record={record}
        fields={[
          { key: "domain", label: "Domain" },
          { key: "displayName", label: "Display Name" },
          { key: "dnsProvider", label: "DNS Provider" },
          { key: "cloudflareProxied", label: "Cloudflare Proxied", type: "checkbox" },
          { key: "checkIntervalHours", label: "Check Interval (hrs)", type: "number" },
          { key: "alertsEnabled", label: "Alerts", type: "checkbox" },
        ]}
        updateAction={updateDomainMonitor}
        onUpdate={async () => {
          "use server";
        }}
        parentHref="/admin/domain-monitors"
        parentLabel="Domain Monitor"
      />
    </AdminPageShell>
  );
}
