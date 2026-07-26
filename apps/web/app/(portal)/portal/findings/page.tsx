import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export const dynamic = "force-dynamic";
export const metadata = { title: "Findings - Portal - Maine CyberTech" };

export default async function PortalFindingsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.findings.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  const sev = (s: string) =>
    ({
      p0: "border-red-500/25 bg-red-500/10 text-red-300",
      p1: "border-amber-500/25 bg-amber-500/10 text-amber-300",
      p2: "border-blue-500/25 bg-blue-500/10 text-blue-300",
      p3: "border-white/10 bg-white/5 text-slate-300",
    })[s] ?? "";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-50">Findings &amp; Remediation</h1>
      <p className="text-sm text-slate-400">
        {items.length} findings tracked for your organization.
      </p>
      <div className="space-y-3">
        {items.map((f) => (
          <div key={String(f.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(f.title)}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Source: {String(f.source)} &bull; Status: {String(f.status)}
                </p>
                {(f.description as string | null) && (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                    {String(f.description)}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${sev(String(f.severity))}`}
              >
                {String(f.severity).toUpperCase()}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No findings reported.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
