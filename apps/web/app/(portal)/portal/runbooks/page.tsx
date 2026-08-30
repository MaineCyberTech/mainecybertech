import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Runbooks - Portal - Maine CyberTech" };

export default async function PortalRunbooksPage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.final.runbooks.list({ organization_id: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Runbooks">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Runbooks" }]}
      />
      <PortalSubnav current="runbooks" />
      <h1 className="text-2xl font-semibold text-slate-50">Runbooks</h1>
      <p className="text-sm text-slate-400">{items.length} runbooks for your organization.</p>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={String(item.id)}
            className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <p className="font-medium text-slate-50">{String(item.title)}</p>
            {item.category ? (
              <p className="mt-1 text-xs text-slate-400">Category: {String(item.category)}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-400">Version: {String(item.version ?? "1.0")}</p>
            <p className="mt-1 text-xs text-slate-400">
              Created: {new Date(String(item.created_at)).toISOString().slice(0, 10)}
            </p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">No runbooks found.</p>}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
