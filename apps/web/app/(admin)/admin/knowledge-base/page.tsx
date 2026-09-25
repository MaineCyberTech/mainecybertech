import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import DataErrorNote from "@/components/admin/DataErrorNote";
import CrudForm from "@/components/admin/CrudForm";
import { createKbArticle } from "@/lib/module-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Knowledge Base - Admin - Maine CyberTech" };

type Props = { searchParams: Promise<{ organizationId?: string }> };

type Article = {
  id: string;
  title: string;
  category: string | null;
  is_published: boolean;
  updated_at: string;
};

export default async function AdminKnowledgeBasePage({ searchParams }: Props) {
  await requireAdminAccess();
  let loadFailed = false;
  const api = getApiClient();
  const { organizationId } = await searchParams;

  let organizations: Array<{ id: string; name: string }> = [];
  try {
    const r = (await api.organizations.list({ limit: 100 })) as unknown as {
      items: Array<{ id: string; name: string }>;
    };
    organizations = r.items ?? [];
  } catch (error) {
    console.error("[admin/knowledge-base]", error);
    loadFailed = true;
  }

  const orgId = organizationId ?? organizations[0]?.id ?? null;

  let articles: Article[] = [];
  if (orgId) {
    try {
      const r = (await api.knowledgeBase.list({ organizationId: orgId, limit: 50 })) as unknown as {
        items: Article[];
      };
      articles = r.items ?? [];
    } catch (error) {
      console.error("[admin/knowledge-base]", error);
      loadFailed = true;
    }
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Knowledge Base" }]} />
      }
      subnav={<AdminSubnav current="knowledge-base" />}
      title="Knowledge Base"
      description="Client-facing self-service articles."
      actions={null}
    >
      {loadFailed && <DataErrorNote what="admin data" />}
      {organizations.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/admin/knowledge-base?organizationId=${org.id}`}
              className={
                org.id === orgId
                  ? "rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-1 text-xs text-emerald-300"
                  : "rounded-md border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-emerald-600/40"
              }
            >
              {org.name}
            </Link>
          ))}
        </div>
      )}

      <CrudForm
        fields={[
          { key: "organizationId", label: "Org ID", required: true, placeholder: "Org UUID" },
          { key: "title", label: "Title", required: true },
          { key: "body", label: "Body", type: "textarea", required: true },
          { key: "category", label: "Category" },
          {
            key: "isPublished",
            label: "Published",
            type: "select",
            options: ["false", "true"],
          },
        ]}
        title="New Article"
        action={createKbArticle}
      />

      <section className="cyber-panel mt-4">
        <h2 className="cyber-heading text-lg">Articles</h2>
        <div className="mt-6 space-y-3">
          {articles.length > 0 ? (
            articles.map((a) => (
              <div key={a.id} className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-50">{a.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {a.category ?? "Uncategorized"} &bull; updated{" "}
                      {new Date(a.updated_at).toISOString().slice(0, 10)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.is_published
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-500/20 text-slate-400"
                    }`}
                  >
                    {a.is_published ? "published" : "draft"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No knowledge base articles.</p>
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
