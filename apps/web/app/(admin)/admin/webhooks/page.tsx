import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Webhooks - Admin - Maine CyberTech" };

export default async function AdminWebhooksPage() {
  await requireAdminAccess();
  const api = getApiClient();
  const endpoints = await api.webhooks.list();

  return (
    <AdminPageShell
      breadcrumbs={<AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Webhooks" }]} />}
      subnav={<AdminSubnav current="webhooks" />}
      title="Webhook Endpoints"
      description="Manage outbound webhook endpoints for event notifications."
    >
      <div className="space-y-4">
        {endpoints.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-8 text-center text-sm text-slate-500">
            No webhook endpoints configured.
          </div>
        ) : (
          endpoints.map((wh: any) => (
            <Link key={wh.id} href={`/admin/webhooks/${wh.id}`}
              className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-5 transition hover:border-emerald-600/20 hover:bg-[#0A1118]/80">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-50">{wh.name}</p>
                  <p className="mt-1 text-sm text-slate-400 truncate">{wh.url}</p>
                  <p className="mt-1 text-xs text-slate-500">{wh.events?.length ?? 0} events &middot; {wh.is_active ? "Active" : "Disabled"}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {wh.last_success_at ? <span className="cyber-pill-success">OK</span> : null}
                  {wh.last_error ? <span className="cyber-pill-warning" title={wh.last_error}>Error</span> : null}
                  {!wh.is_active ? <span className="cyber-pill">Disabled</span> : null}
                </div>
              </div>
            </Link>
          ))
        )}

        <Link href="/admin/webhooks/new" className="cyber-button inline-block">
          + New Webhook
        </Link>
      </div>
    </AdminPageShell>
  );
}
