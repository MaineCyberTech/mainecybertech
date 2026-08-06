import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import ProcurementCompareClient from "./ProcurementCompareClient";
import { createProcurement } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Procurement - More Tools - Admin" };

export default async function ProcurementPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; vendor_name?: string }> = [];
  try {
    const r = await api.final.procurement.list({});
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
            { label: "Procurement" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Procurement"
      description="Vendor quotes with competitor comparison and notes."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "vendorName", label: "Vendor", required: true },
          { key: "product", label: "Product", required: true },
          { key: "quoteAmount", label: "Quote", type: "number" },
          { key: "competitorQuote", label: "Competitor Quote", type: "number" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        title="New Procurement"
        action={createProcurement}
      />
      {items.length >= 2 && (
        <div className="mt-6">
          <ProcurementCompareClient items={items as Array<Record<string, unknown>>} />
        </div>
      )}
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/procurement/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.vendor_name ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="ðŸ›’"
              title="No procurement records"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
