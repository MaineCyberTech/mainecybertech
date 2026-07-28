import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import { StatusPill } from "@/components/admin/StatusPill";
export const dynamic = "force-dynamic";
export const metadata = { title: "Insurance Evidence Binder - Admin - Maine CyberTech" };

export default async function InsuranceBinderPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let items = [] as Array<{
    id: string;
    title: string;
    evidence_type: string;
    coverage_area: string;
    status: string;
    expiry_date: string | null;
    created_at: string;
  }>;

  try {
    const r = (await api.insuranceBinder.list({})) as any;
    items = r.items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[{ label: "Admin", href: "/admin" }, { label: "Insurance Evidence Binder" }]}
        />
      }
      subnav={<AdminSubnav current="insurance-binder" />}
      title="Insurance Evidence Binder"
      description="Organize and track evidence for cyber insurance audits across 8 coverage areas."
      actions={null}
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Evidence Records</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.evidence_type} &bull; {item.coverage_area}
                      {item.expiry_date
                        ? ` &bull; Expires ${new Date(item.expiry_date).toISOString().slice(0, 10)}`
                        : ""}{" "}
                      &bull; {new Date(item.created_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={item.status} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📁"
              title="No evidence collected yet"
              description="Start building your cyber insurance evidence binder by adding your first piece of evidence."
              actionHref="/admin/insurance-binder"
              actionLabel="Refresh"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
