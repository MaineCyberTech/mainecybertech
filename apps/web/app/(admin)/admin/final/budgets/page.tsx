import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createBudget } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Budget Roadmap - More Tools - Admin" };

export default async function BudgetPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; item_name?: string }> = [];
  try {
    const r = await api.final.budgets.list({});
    items = (r as { items: typeof items }).items as typeof items;
  } catch {
    /* graceful */
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "More Tools", href: "/admin/final" },
            { label: "Budget Roadmap" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Budget Roadmap"
      description="Budget items with costs, fiscal years, and priorities."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "itemName", label: "Item", required: true },
          { key: "category", label: "Category" },
          { key: "estimatedCost", label: "Cost", type: "number" },
          { key: "fiscalYear", label: "Fiscal Year", type: "number" },
          { key: "priority", label: "Priority" },
        ]}
        title="New Budget Item"
        action={createBudget}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/budgets/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.item_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ’°"
              title="No budget items"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
