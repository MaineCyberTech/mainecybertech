import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { requireAdminAccess } from "@/lib/auth/admin";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import WebhookDetailClient from "./WebhookDetailClient";
import DataErrorNote from "@/components/admin/DataErrorNote";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ webhookId: string }> }) {
  const { webhookId } = await params;
  return { title: `Webhook Details (${webhookId.slice(0, 8)}) - Admin - Maine CyberTech` };
}

type Props = { params: Promise<{ webhookId: string }> };

export default async function WebhookDetailPage({ params }: Props) {
  await requireAdminAccess();
  const { webhookId } = await params;
  const api = getApiClient();

  let webhook: {
    id: string;
    name: string;
    url: string;
    secret?: string | null;
    events?: string[];
    is_active: boolean;
  };
  try {
    webhook = await withRetry(() => api.webhooks.get(webhookId));
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }

  let deliveries: {
    items: Array<{
      id: string;
      event: string;
      status: string;
      response_status?: number | null;
      duration_ms?: number | null;
      created_at: string;
    }>;
    total: number;
  } = { items: [], total: 0 };
  let loadFailed = false;
  try {
    deliveries = await api.webhooks.listDeliveries(webhookId, { limit: 20 });
  } catch (error) {
    console.error("[[webhookId]/page]", error);
    loadFailed = true;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Webhooks", href: "/admin/webhooks" },
            { label: webhook.name },
          ]}
        />
      }
      subnav={<AdminSubnav current="webhooks" />}
      title={webhook.name}
      actions={
        <Link href="/admin/webhooks" className="cyber-button-secondary">
          Back
        </Link>
      }
    >
      {loadFailed && <DataErrorNote what="data" />}
      <WebhookDetailClient
        webhook={webhook}
        deliveries={deliveries.items}
        totalDeliveries={deliveries.total}
      />
    </AdminPageShell>
  );
}
