import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import StatusPill from "@/components/StatusPill";
import DataErrorNote from "@/components/admin/DataErrorNote";
import { formatDateTime } from "@/lib/format";
import type { AiDraftOutput } from "@mct/sdk";
import DraftReviewForm from "./DraftReviewForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Draft Review - Admin - Maine CyberTech" };

const PAGE_SIZE = 50;

/**
 * FEAT-P3-009: the documented human review gate for AI drafts was reachable
 * only through the API/OpenAPI. This queue is the product consumer: drafts are
 * listed and can be approved/rejected with reviewer notes.
 */
export default async function AiDraftReviewPage() {
  await requireAdminAccess();
  const api = getApiClient();

  let drafts: AiDraftOutput[] = [];
  let loadFailed = false;
  try {
    const result = await api.ai.drafts.list({ limit: PAGE_SIZE, status: "draft" });
    drafts = result.items ?? [];
  } catch {
    loadFailed = true;
  }

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "AI Tools", href: "/admin/ai" },
            { label: "Draft Review" },
          ]}
        />
      }
      subnav={<AdminSubnav current="ai" />}
      title="AI Draft Review"
      description="Drafts stay inactive until a reviewer approves or rejects them; every decision records the reviewer and notes."
      actions={
        <Link href="/admin/ai" className="cyber-button-secondary">
          Back to AI Tools
        </Link>
      }
    >
      {loadFailed ? <DataErrorNote what="AI drafts" /> : null}
      <section className="cyber-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Pending review</h2>
          <span className="cyber-pill">{drafts.length} draft(s)</span>
        </div>

        {drafts.length === 0 ? (
          !loadFailed ? (
            <div className="mt-6">
              <EmptyState
                icon="🛡️"
                title="No AI drafts awaiting review"
                description="Generated outputs will appear here before they can be used."
              />
            </div>
          ) : null
        ) : (
          <div className="mt-6 space-y-4">
            {drafts.map((draft) => (
              <article
                key={draft.id}
                className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-50">
                      {draft.module_key}
                      {draft.prompt_key ? ` · ${draft.prompt_key}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Created {formatDateTime(draft.created_at)}
                      {draft.prompt_version ? ` · prompt v${draft.prompt_version}` : ""}
                    </p>
                  </div>
                  <StatusPill status={draft.status} />
                </div>

                <pre className="mt-3 max-h-56 overflow-auto rounded bg-cyber-base/80 p-3 text-xs text-slate-300">
                  {JSON.stringify(draft.draft_content, null, 2)}
                </pre>

                <DraftReviewForm draftId={draft.id} organizationId={draft.organization_id} />
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
}
