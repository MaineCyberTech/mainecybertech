import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "File Requests - Portal - Maine CyberTech" };

export default async function PortalFileRequestsPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.fileRequests.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Secure File Requests">
      <Breadcrumbs items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "File Requests" }]} />
      <PortalSubnav current="file-requests" />
      <h1 className="text-2xl font-semibold text-slate-50">Secure File Requests</h1>
      <p className="text-sm text-slate-400">{items.length} file request links available.</p>
      <div className="space-y-3">
        {items.map((fr) => (
          <div
            key={String(fr.id)}
            className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-50">{String(fr.title)}</p>
                {(fr.description as string | null) && (
                  <p className="mt-1 text-xs text-slate-400">{String(fr.description)}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {String(fr.upload_count)}/{String(fr.max_files)} uploads &bull; Expires:{" "}
                  {(fr.expires_at as string | null)
                    ? new Date(String(fr.expires_at)).toISOString().slice(0, 10)
                    : "N/A"}
                </p>
              </div>
              <span
                className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${fr.status === "active" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300"}`}
              >
                {String(fr.status ?? "")}
              </span>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No active file request links.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
