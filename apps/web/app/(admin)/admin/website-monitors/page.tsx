import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

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
      actions={
        <Link href="/admin/website-monitors/new" className="cyber-button">
          Add Website
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((w) => (
              <div key={w.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{w.display_name || w.url}</p>
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
              icon="🌐"
              title="No websites monitored"
              description="Add websites to monitor uptime and SSL."
              actionHref="/admin/website-monitors/new"
              actionLabel="Add Website"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
