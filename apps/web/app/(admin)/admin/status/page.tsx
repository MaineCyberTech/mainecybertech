import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createStatusItem } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "Status Page - Admin" };

const sev = (s: string) =>
  ({ info: "emerald", warning: "amber", critical: "red", maintenance: "blue" })[s] || "slate";

export default async function StatusPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    title: string;
    description: string | null;
    severity: string;
    is_public: boolean;
    is_resolved: boolean;
  }> = [];
  try {
    const r = await api.batch.status.list({});
    items = r.items as unknown as typeof items;
  } catch {
    /* */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Status" }]} />
      }
      subnav={<AdminSubnav current="status" />}
      title="Public Status & Maintenance Notices"
      description="Publish maintenance windows and incident updates for client visibility."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "title", label: "Title", required: true },
          {
            key: "severity",
            label: "Severity",
            type: "select",
            options: ["info", "warning", "critical", "maintenance"],
            required: true,
          },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        title="New Status Item"
        action={createStatusItem}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Link
                      className="transition hover:text-emerald-400"
                      href={`/admin/status/${s.id}`}
                    >
                      <p className="font-medium text-slate-50">{s.title}</p>
                    </Link>
                    {s.description && (
                      <p className="mt-1 text-xs text-slate-400">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {s.is_public && (
                      <span className="inline-flex min-h-6 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                        Public
                      </span>
                    )}
                    <span
                      className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${s.is_resolved ? "border-white/10 bg-white/5 text-slate-300" : `border-${sev(s.severity)}-500/25 bg-${sev(s.severity)}-500/10 text-${sev(s.severity)}-300`}`}
                    >
                      {s.is_resolved ? "Resolved" : s.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📢"
              title="No status notices"
              description="Publish maintenance windows or incident updates."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
