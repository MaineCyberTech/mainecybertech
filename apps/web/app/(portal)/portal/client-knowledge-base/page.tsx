import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Knowledge Base - Portal - Maine CyberTech" };

export default async function PortalKnowledgeBasePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.eduAutomation.kb.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Knowledge Base">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Knowledge Base" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Knowledge Base</h1>
      <p className="text-sm text-slate-400">
        {items.length} article{items.length !== 1 ? "s" : ""} available for your organization.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((a) => (
          <div key={String(a.id)} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
            <p className="font-medium text-slate-50">{String(a.title || "Article")}</p>
            <p className="mt-1 text-xs text-slate-400">
              {(a.category as string) && <span>Category: {String(a.category)} &bull; </span>}
              Published: {a.is_published ? "Yes" : "No"}
            </p>
            {(a.content as string) && (
              <p className="mt-2 line-clamp-2 text-xs text-slate-400">{String(a.content)}</p>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-2 text-sm text-slate-400">No knowledge base articles yet.</p>
        )}
      </div>
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
