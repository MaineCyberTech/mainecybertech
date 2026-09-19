import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createSatisfaction } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Satisfaction Pulse - More Tools - Admin" };

export default async function SatisfactionPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; subject?: string }> = [];
  try {
    const r = await api.final.satisfaction.list({});
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
            { label: "Satisfaction Pulse" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="Satisfaction Pulse"
      description="Client satisfaction surveys with ratings and feedback."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "subject", label: "Subject", required: true },
          { key: "question", label: "Question" },
          { key: "rating", label: "Rating (0-10)", type: "number" },
          { key: "feedback", label: "Feedback", type: "textarea" },
        ]}
        title="New Pulse Survey"
        action={createSatisfaction}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/satisfaction/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.subject ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="😊"
              title="No satisfaction surveys"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
