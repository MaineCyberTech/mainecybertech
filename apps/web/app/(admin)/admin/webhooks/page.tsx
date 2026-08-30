import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { requirePermission } from "@/lib/auth/permissions";
import AdminListPage from "@/components/admin/AdminListPage";
import { WebhookEndpoint } from "@mct/sdk";

export const dynamic = "force-dynamic";
export const metadata = { title: "Webhooks - Admin - Maine CyberTech" };

export default async function AdminWebhooksPage() {
  await requireAdminAccess();
  await requirePermission("webhooks", "view");
  const api = getApiClient();
  const endpoints = await api.webhooks.list();

  return (
    <AdminListPage
      title="Webhook Endpoints"
      description="Manage outbound webhook endpoints for event notifications."
      subnavCurrent="webhooks"
      items={endpoints}
      newHref="/admin/webhooks/new"
      newLabel="+ New Webhook"
      emptyMessage="No webhook endpoints configured."
      getId={(wh: WebhookEndpoint) => wh.id}
      renderRow={(wh: WebhookEndpoint) => (
        <Link
          href={`/admin/webhooks/${wh.id}`}
          className="block rounded-lg border border-white/10 bg-cyber-base/60 p-5 transition hover:border-emerald-600/20 hover:bg-cyber-base/80"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="font-medium text-slate-50">{wh.name}</p>
              <p className="mt-1 truncate text-sm text-slate-400">{wh.url}</p>
              <p className="mt-1 text-xs text-slate-400">
                {wh.events?.length ?? 0} events &middot; {wh.is_active ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {wh.last_success_at ? <span className="cyber-pill-success">OK</span> : null}
              {wh.last_error ? (
                <span className="cyber-pill-warning" title={wh.last_error}>
                  Error
                </span>
              ) : null}
              {!wh.is_active ? <span className="cyber-pill">Disabled</span> : null}
            </div>
          </div>
        </Link>
      )}
    />
  );
}
