import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Status - Portal - Maine CyberTech" };

export default async function PortalStatusPage() {
  const api = getApiClient();
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.batch.status.public();
    items = r as unknown as typeof items;
  } catch {}

  const sev = (s: string) =>
    ({
      info: "bg-emerald-500/10 text-emerald-300",
      warning: "bg-amber-500/10 text-amber-300",
      critical: "bg-red-500/10 text-red-300",
      maintenance: "bg-blue-500/10 text-blue-300",
    })[s] ?? "";

  return (
    <div className="space-y-6" role="region" aria-label="Service Status">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Status" }]} />
      <PortalSubnav current="status" />
      <h1 className="text-2xl font-semibold text-slate-50">Service Status</h1>
      <div className="space-y-3">
        {items.map((s) => (
          <div key={String(s.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(s.title)}</p>
                {(s.description as string | null) && (
                  <p className="mt-1 text-sm text-slate-400">{String(s.description)}</p>
                )}
                {(s.scheduled_start as string | null) && (
                  <p className="mt-1 text-xs text-slate-400">
                    Scheduled: {new Date(String(s.scheduled_start)).toISOString().slice(0, 10)}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex min-h-6 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${sev(String(s.severity))}`}
              >
                {String(s.severity)}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#071018]/70 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-2xl">
              &#10003;
            </div>
            <h3 className="font-orbitron font-semibold text-slate-50">All Systems Operational</h3>
            <p className="mt-2 text-sm text-slate-400">
              No active incidents or scheduled maintenance.
            </p>
          </div>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
