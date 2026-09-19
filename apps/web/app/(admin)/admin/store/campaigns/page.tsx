import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import CampaignsManagerClient from "@/components/store/CampaignsManagerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seasonal Campaigns - Admin - Maine CyberTech" };

export default async function AdminCampaignsPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Campaigns" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-campaigns" />}
      title="Seasonal Campaigns"
      description="Manage featured seasonal marketing campaigns and enable/disable them."
    >
      <CampaignsManagerClient />
    </AdminPageShell>
  );
}
