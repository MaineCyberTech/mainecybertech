import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminSLAClient from "@/components/admin/AdminSLAClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "SLA Tracking - Admin - Maine CyberTech" };

export default async function AdminSLAPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [organizationsResult, slaMetrics] = await Promise.all([
    api.organizations.list({ limit: 100 }),
    api.sla.metrics({ days: 30 }).catch(() => null),
  ]);
  const organizations = organizationsResult.items ?? [];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "SLA Tracking" }]} />
      }
      subnav={<AdminSubnav current="sla" />}
      title="SLA Tracking"
      description="Monitor service-level agreement metrics across organizations."
    >
      <AdminSLAClient organizations={organizations} initialMetrics={slaMetrics} />
    </AdminPageShell>
  );
}
