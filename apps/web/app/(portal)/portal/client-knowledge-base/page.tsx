import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import { createArticle } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Knowledge Base - Portal - Maine CyberTech" };

export default async function PortalKnowledgeBasePage() {
  const membership = await getApprovedMembership();
  if (!membership) return null;
  const api = getApiClient();
  const orgId = membership.organization_id as string;
  let items: Array<Record<string, unknown>> = [];
  try {
    const r = await api.knowledgeBase.list({ organizationId: orgId });
    items = r.items as unknown as typeof items;
  } catch {}

  return (
    <div className="space-y-6" role="region" aria-label="Knowledge Base">
      <Breadcrumbs
        items={[{ label: "Portal", href: "/portal/dashboard" }, { label: "Knowledge Base" }]}
      />
      <h1 className="text-2xl font-semibold text-slate-50">Knowledge Base</h1>
      {!membership?.organization_id ? (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-6 text-amber-300">
          <h3 className="font-semibold">No Organization Access</h3>
          <p className="mt-2 text-sm">
            You are not currently a member of any organization. Please contact your administrator to
            request access.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            {items.length} article{items.length !== 1 ? "s" : ""} available for your organization.
          </p>

          <form
            action={async (formData) => {
              await createArticle(formData);
            }}
            className="space-y-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            aria-label="Create knowledge base article"
          >
            <h2 className="font-medium text-slate-50">Add an article</h2>
            <input
              name="title"
              placeholder="Title"
              className="w-full rounded border border-white/10 bg-transparent px-3 py-2 text-sm text-slate-50"
            />
            <textarea
              name="body"
              placeholder="Body"
              rows={4}
              className="w-full rounded border border-white/10 bg-transparent px-3 py-2 text-sm text-slate-50"
            />
            <input
              name="category"
              placeholder="Category (optional)"
              className="w-full rounded border border-white/10 bg-transparent px-3 py-2 text-sm text-slate-400"
            />
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Create
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((a) => (
              <div key={String(a.id)} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <p className="font-medium text-slate-50">{String(a.title || "Article")}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {(a.category as string) && <span>Category: {String(a.category)} &bull; </span>}
                  Published: {a.is_published ? "Yes" : "No"}
                </p>
                {((a.body as string) || (a.content as string)) && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-400">
                    {String((a.body as string) || (a.content as string))}
                  </p>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <p className="col-span-2 text-sm text-slate-400">No knowledge base articles yet.</p>
            )}
          </div>
        </>
      )}
      <Link href="/portal/dashboard" className="text-sm text-emerald-500 hover:text-emerald-400">
        &larr; Dashboard
      </Link>
    </div>
  );
}
