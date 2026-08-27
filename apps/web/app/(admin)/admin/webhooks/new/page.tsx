import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import NewWebhookForm from "@/components/admin/NewWebhookForm";
import { Organization } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Webhook - Admin - Maine CyberTech" };

export default async function NewWebhookPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const organizations = await api.organizations.list();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Webhooks", href: "/admin/webhooks" },
            { label: "New" },
          ]}
        />
      }
      subnav={<AdminSubnav current="webhooks" />}
      title="New Webhook Endpoint"
    >
      <NewWebhookForm organizations={organizations.map((o: Organization) => ({ id: o.id, name: o.name }))} />
    </AdminPageShell>
  );
}
