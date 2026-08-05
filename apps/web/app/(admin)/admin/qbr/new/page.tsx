import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import QbrGenerateForm from "./QbrGenerateForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New QBR - Admin - Maine CyberTech" };

export default async function NewQbrPage() {
  await requireAdminAccess();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "QBR Reports", href: "/admin/qbr" },
            { label: "New QBR" },
          ]}
        />
      }
      subnav={<AdminSubnav current="qbr" />}
      title="Generate QBR Report"
      description="Pull tickets, projects, findings, assets, and monitor alerts into a quarterly business review."
    >
      <QbrGenerateForm />
    </AdminPageShell>
  );
}
