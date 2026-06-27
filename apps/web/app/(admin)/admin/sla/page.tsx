import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminSLAClient from "@/components/admin/AdminSLAClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "SLA Tracking - Admin - Maine CyberTech" };

export default async function AdminSLAPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [organizations, slaMetrics] = await Promise.all([
    api.organizations.list(),
    api.sla.metrics({ days: 30 }).catch(() => null),
  ]);

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "SLA Tracking" }]}
        />
      }
      subnav={<AdminSubnav current="sla" />}
      title="SLA Tracking"
      description="Monitor service-level agreement metrics across organizations."
    >
      <AdminSLAClient
        organizations={organizations ?? []}
        initialMetrics={slaMetrics}
      />
    </AdminPageShell>
  );
}
