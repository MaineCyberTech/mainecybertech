import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createWebsiteMonitor } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Website Monitor - Admin" };

export default async function WebsiteMonitorPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    url: string;
    display_name: string | null;
    last_status: string;
    last_response_ms: number | null;
    ssl_valid: boolean;
    lighthouse_score: number | null;
  }> = [];
  try {
    const r = await api.batch.websiteMonitors.list({});
    items = r.items as typeof items;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Website Monitor" }]} />
      }
      subnav={<AdminSubnav current="website-monitors" />}
      title="Website Uptime & SSL Monitor"
      description="Track uptime, SSL expiry, and performance across client websites."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "url", label: "URL", required: true },
          { key: "displayName", label: "Display Name" },
        ]}
        title="New Website Monitor"
        action={createWebsiteMonitor}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((w) => (
              <div key={w.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      className="transition hover:text-emerald-400"
                      href={`/admin/website-monitors/${w.id}`}
                    >
                      <p className="font-medium text-slate-50">{w.display_name || w.url}</p>
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">
                      {w.url} &bull; {w.last_status}{" "}
                      {w.last_response_ms ? `(${w.last_response_ms}ms)` : ""} &bull; SSL:{" "}
                      {w.ssl_valid ? "OK" : "FAIL"}{" "}
                      {w.lighthouse_score ? `&bull; LH: ${w.lighthouse_score}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="Ã°Å¸Å’Â"
              title="No websites monitored"
              description="Add websites to monitor uptime and SSL."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
