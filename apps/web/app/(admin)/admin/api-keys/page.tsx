import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import AdminApiKeysClient from "@/components/admin/AdminApiKeysClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "API Keys - Admin - Maine CyberTech" };

export default async function AdminApiKeysPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const [organizations, apiKeys] = await Promise.all([
    api.organizations.list(),
    api.apiKeys.list(),
  ]);

  return (
    <AdminPageShell
      breadcrumbs={
        <AdminBreadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "API Keys" }]}
        />
      }
      subnav={<AdminSubnav current="api-keys" />}
      title="API Keys"
      description="Manage API keys for programmatic access across organizations."
    >
      <AdminApiKeysClient
        organizations={organizations ?? []}
        initialKeys={apiKeys ?? []}
      />
    </AdminPageShell>
  );
}
