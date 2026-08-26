import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import { getLifecycleStates } from "@/lib/catalog/v5-loaders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Lifecycle - Store - Admin - Maine CyberTech" };

function lifecyclePill(status: string) {
  const map: Record<string, string> = {
    draft: "border-slate-500/25 bg-slate-500/10 text-slate-400",
    ready_for_review: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    published: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    seasonal: "border-blue-500/25 bg-blue-500/10 text-blue-400",
    paused: "border-white/10 bg-white/5 text-slate-400",
    archived: "border-red-500/25 bg-red-500/10 text-red-400",
    needs_update: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    compliance_review_required: "border-red-500/25 bg-red-500/10 text-red-400",
  };
  return map[status] ?? "border-white/10 bg-white/5 text-slate-400";
}

export default async function AdminStoreLifecyclePage() {
  await requireAdminAccess();
  const statuses = getLifecycleStates();

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Store", href: "/admin/store" },
            { label: "Product Lifecycle" },
          ]}
        />
      }
      subnav={<AdminSubnav current="store-lifecycle" />}
      title="Product Lifecycle Workflow"
      description={`${statuses.length} lifecycle states`}
      actions={
        <button
          type="button"
          disabled
          title="Coming soon"
          className="cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500"
        >
          Review Lifecycle
        </button>
      }
    >
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Lifecycle States</h2>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((status, i) => (
            <span key={status}>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${lifecyclePill(status)}`}
              >
                {status.replace(/_/g, " ")}
              </span>
              {i < statuses.length - 1 && (
                <svg
                  className="ml-2 inline-block h-4 w-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </span>
          ))}
        </div>
      </section>
    </AdminPageShell>
  );
}
