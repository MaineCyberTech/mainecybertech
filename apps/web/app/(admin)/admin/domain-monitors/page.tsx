import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Domain Monitor - Admin - Maine CyberTech" };

function okPill(ok: boolean) {
  return ok ? (
    <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
      OK
    </span>
  ) : (
    <span className="inline-flex min-h-8 items-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-red-300">
      FAIL
    </span>
  );
}

export default async function DomainMonitorsPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let monitors: Array<{
    id: string;
    domain: string;
    display_name: string | null;
    ssl_valid: boolean;
    spf_status: string;
    dkim_status: string;
    dmarc_status: string;
    last_checked_at: string | null;
    dns_provider: string;
  }> = [];
  let stats = {
    total: 0,
    sslInvalid: 0,
    sslExpiring: 0,
    spfMissing: 0,
    dkimMissing: 0,
    dmarcMissing: 0,
    nsMismatch: 0,
    notProxied: 0,
  };

  try {
    const [r, s] = await Promise.allSettled([
      api.domainMonitors.list({}),
      api.domainMonitors.stats({}),
    ]);
    if (r.status === "fulfilled") monitors = r.value.items as typeof monitors;
    if (s.status === "fulfilled") stats = s.value;
  } catch {
    /* graceful */
  }

  const issues = [
    stats.sslInvalid > 0 && `${stats.sslInvalid} SSL invalid`,
    stats.sslExpiring > 0 && `${stats.sslExpiring} SSL expiring`,
    stats.spfMissing > 0 && `${stats.spfMissing} SPF missing`,
    stats.dkimMissing > 0 && `${stats.dkimMissing} DKIM missing`,
    stats.dmarcMissing > 0 && `${stats.dmarcMissing} DMARC missing`,
  ].filter(Boolean) as string[];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Domain Monitor" }]} />
      }
      subnav={<AdminSubnav current="domain-monitors" />}
      title="DNS & Domain Health Monitor"
      description="Track SSL, SPF, DKIM, DMARC, nameservers, and Cloudflare posture across client domains."
      actions={
        issues.length > 0 ? (
          <div className="text-xs text-amber-400">{issues.join(" · ")}</div>
        ) : (
          <div className="text-xs text-emerald-400">All clear</div>
        )
      }
    >
      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Monitored Domains ({stats.total})</h2>
        </div>
        <div className="mt-6 space-y-3">
          {monitors.length > 0 ? (
            monitors.map((d) => (
              <Link
                key={d.id}
                href={`/admin/domain-monitors/${d.id}`}
                className="block rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 transition hover:border-emerald-500/20 hover:bg-[#0A1118]/80"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{d.display_name ?? d.domain}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {d.domain} &bull; {d.dns_provider} &bull; SPF: {d.spf_status} &bull; DKIM:{" "}
                      {d.dkim_status} &bull; DMARC: {d.dmarc_status}
                      {d.last_checked_at
                        ? ` &bull; Checked ${new Date(d.last_checked_at).toISOString().slice(0, 10)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">{okPill(d.ssl_valid)}</div>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="🌐"
              title="No domains monitored"
              description="Add domains to track SSL, DNS, and email deliverability posture."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
