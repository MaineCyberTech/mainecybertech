import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

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
      actions={
        <Link href="/admin/dmarc/new" className="cyber-button">
          New Assessment
        </Link>
      }
    >
      <section className="cyber-panel">
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((d) => (
              <div key={d.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="font-medium text-slate-50">{d.domain}</p>
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
              actionHref="/admin/dmarc/new"
              actionLabel="New Assessment"
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
