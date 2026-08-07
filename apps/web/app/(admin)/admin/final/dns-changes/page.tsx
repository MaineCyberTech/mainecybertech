import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createDnsChange } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "DNS Change - More Tools - Admin" };

export default async function DnsChangePage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{ id: string; domain?: string }> = [];
  try {
    const r = await api.final.dnsChanges.list({});
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
            { label: "DNS Change" },
          ]}
        />
      }
      subnav={<AdminSubnav current="final" />}
      title="DNS Change"
      description="Track DNS changes with current and proposed values."
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true },
          { key: "domain", label: "Domain", required: true },
          { key: "changeType", label: "Change Type", required: true },
          { key: "proposedValue", label: "Proposed" },
          { key: "currentValue", label: "Current" },
          { key: "changeDescription", label: "Description", type: "textarea" },
        ]}
        title="New DNS Change"
        action={createDnsChange}
      />
      <section className="cyber-panel mt-6">
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <Link
                  className="transition hover:text-emerald-400"
                  href={`/admin/final/dns-changes/${item.id}`}
                >
                  <p className="font-medium text-slate-50">{item.domain ?? String(item.id)}</p>
                </Link>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🌐"
              title="No DNS changes"
              description="Use the form above to create one."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
