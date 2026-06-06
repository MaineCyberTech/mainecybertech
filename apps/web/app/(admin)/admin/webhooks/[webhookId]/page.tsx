import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import WebhookDetailClient from "./WebhookDetailClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Webhook Details - Admin - Maine CyberTech" };

type Props = { params: Promise<{ webhookId: string }> };

export default async function WebhookDetailPage({ params }: Props) {
  await requireAdminAccess();
  const { webhookId } = await params;
  const api = getApiClient();

  let webhook: any;
  try {
    webhook = await api.webhooks.get(webhookId);
  } catch {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Webhook not found.</div>
    );
  }

  let deliveries: any = { items: [], total: 0 };
  try { deliveries = await api.webhooks.listDeliveries(webhookId, { limit: 20 }); } catch {}

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Webhooks", href: "/admin/webhooks" }, { label: webhook.name }]} />}
      subnav={<AdminSubnav current="webhooks" />}
      title={webhook.name}
      actions={<a href="/admin/webhooks" className="cyber-button-secondary">Back</a>}
    >
      <WebhookDetailClient
        webhook={webhook}
        deliveries={deliveries.items}
        totalDeliveries={deliveries.total}
      />
    </AdminPageShell>
  );
}
