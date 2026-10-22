import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { withRetry } from "@/lib/retry";
import { getApprovedMembership } from "@/lib/auth/membership";
import Breadcrumbs from "@/components/Breadcrumbs";
import { formatDate } from "@/lib/format";
import CommentBody from "@/components/CommentBody";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Knowledge Base (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

type Article = {
  id: string;
  title: string;
  body: string;
  category: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
};

export default async function KnowledgeBaseArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  let article: Article | null = null;
  try {
    article = (await withRetry(() => api.knowledgeBase.get(id))) as unknown as Article;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }
  if (!article) notFound();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Knowledge Base", href: "/portal/client-knowledge-base" },
          { label: article.title },
        ]}
      />

      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{article.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {article.category ? `${article.category} • ` : ""}
          Updated {formatDate(article.updated_at ?? article.created_at)}
        </p>
      </div>

      <article className="cyber-panel">
        <CommentBody
          body={article.body}
          className="markdown-body whitespace-pre-wrap text-sm leading-relaxed text-slate-300"
        />
      </article>

      {article.tags && article.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <Link href="/portal/client-knowledge-base" className="cyber-button-secondary">
        Back to knowledge base
      </Link>
    </div>
  );
}
