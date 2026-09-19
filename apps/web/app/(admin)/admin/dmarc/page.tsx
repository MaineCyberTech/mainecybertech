import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CrudForm from "@/components/admin/CrudForm";
import { createDmarc } from "@/lib/module-actions";
export const dynamic = "force-dynamic";
export const metadata = { title: "DMARC Coach - Admin" };

export default async function DmarcPage() {
  await requireAdminAccess();
  const api = getApiClient();
  let items: Array<{
    id: string;
    domain: string;
    spf_valid: boolean;
    dkim_configured: boolean;
    dmarc_valid: boolean;
    dmarc_policy: string | null;
    status: string;
  }> = [];
  try {
    const r = await api.batch.dmarc.list({});
    items = r.items as typeof items;
  } catch {
    /* */
  }

  const ok = (v: boolean) =>
    v ? (
      <span className="text-xs text-emerald-400">OK</span>
    ) : (
      <span className="text-xs text-red-400">MISSING</span>
    );

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "DMARC Coach" }]} />
      }
      subnav={<AdminSubnav current="dmarc" />}
      title="Email Deliverability DMARC Coach"
      description="Guide clients through SPF, DKIM, and DMARC setup for email security."
      actions={null}
    >
      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "domain", label: "Domain", required: true },
        ]}
        title="New DMARC"
        action={createDmarc}
      />
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((d) => (
              <div key={d.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Link className="transition hover:text-emerald-400" href={`/admin/dmarc/${d.id}`}>
                    <p className="font-medium text-slate-50">{d.domain}</p>
                  </Link>
                  <div className="flex items-center gap-3 text-xs">
                    <span>SPF: {ok(d.spf_valid)}</span>
                    <span>DKIM: {ok(d.dkim_configured)}</span>
                    <span>
                      DMARC: {ok(d.dmarc_valid)} {d.dmarc_policy ? `(${d.dmarc_policy})` : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📧"
              title="No DMARC assessments"
              description="Record SPF/DKIM/DMARC assessment results."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
