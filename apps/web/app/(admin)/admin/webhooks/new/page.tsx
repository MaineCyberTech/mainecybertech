import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import NewWebhookForm from "@/components/admin/NewWebhookForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Webhook - Admin - Maine CyberTech" };

export default async function NewWebhookPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const organizations = await api.organizations.list();

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Webhooks", href: "/admin/webhooks" }, { label: "New" }]} />}
      subnav={<AdminSubnav current="webhooks" />}
      title="New Webhook Endpoint"
    >
      <NewWebhookForm
        organizations={organizations.map((o: any) => ({ id: o.id, name: o.name }))}
      />
    </AdminPageShell>
  );
}
