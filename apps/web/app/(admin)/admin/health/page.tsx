import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import HealthDashboardClient from "@/components/HealthDashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Health Dashboard - Admin - Maine CyberTech" };

export default function AdminHealthPage() {
  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Health" }]} />
      }
      subnav={<AdminSubnav current="home" />}
      title="Service Health"
      description="Real-time status of API, database, and worker services."
    >
      <HealthDashboardClient />
    </AdminPageShell>
  );
}
