import Link from "next/link";
import { notFound } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { withRetry } from "@/lib/retry";
import { hasPermission } from "@/lib/permissions";
import Breadcrumbs from "@/components/Breadcrumbs";
import PortalSubnav from "@/components/portal/PortalSubnav";
import StatusPill from "@/components/StatusPill";
import CommentBody from "@/components/CommentBody";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import ApprovalActionsClient from "./ApprovalActionsClient";
import type { ApprovalDetail } from "@mct/sdk";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Approval (${id.slice(0, 8)}) - Portal - Maine CyberTech` };
}

type CommentRecord = {
  id?: string;
  body?: string;
  author_name?: string;
  created_at?: string;
  is_internal?: boolean;
};

type TimelineRecord = {
  id?: string;
  event_type?: string;
  created_at?: string;
};

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  let approval: ApprovalDetail | null = null;
  try {
    approval = (await withRetry(() => api.approvals.get(id))) as unknown as ApprovalDetail;
  } catch (error) {
    if ((error as { status?: number })?.status === 404) notFound();
    throw error;
  }
  if (!approval) notFound();

  const permissions = await Promise.resolve()
    .then(() => api.permissions.getMyPermissions())
    .catch(() => null);
  const canDecide =
    Boolean(permissions?.isSuperAdmin) || hasPermission(permissions?.keys, "approvals", "edit");

  const comments = ((approval.comments ?? []) as CommentRecord[]).filter(
    (comment) => !comment.is_internal,
  );
  const timeline = (approval.timeline ?? []) as TimelineRecord[];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Portal", href: "/portal/dashboard" },
          { label: "Approvals", href: "/portal/approvals" },
          { label: approval.request_subject },
        ]}
      />
      <PortalSubnav current="approvals" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-50">{approval.request_subject}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {approval.request_type.replace(/_/g, " ")} • Requested{" "}
            {formatRelativeTime(approval.created_at)}
            {approval.due_at ? ` • Due ${formatDateTime(approval.due_at)}` : ""}
          </p>
        </div>
        <StatusPill status={approval.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Request</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {approval.request_body || "No additional details were provided."}
            </p>
            {approval.rejection_reason ? (
              <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                Rejection reason: {approval.rejection_reason}
              </p>
            ) : null}
          </section>

          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">
              Comments <span className="text-sm text-slate-500">({comments.length})</span>
            </h2>
            <div className="mt-4 space-y-3">
              {comments.length > 0 ? (
                comments.map((comment, index) => (
                  <div
                    key={comment.id ?? index}
                    className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
                  >
                    <CommentBody
                      body={comment.body ?? ""}
                      className="markdown-body text-sm text-slate-300"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {comment.author_name ?? "Account team"} •{" "}
                      {formatRelativeTime(comment.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No comments yet.</p>
              )}
            </div>
          </section>

          <ApprovalActionsClient
            approvalId={approval.id}
            canDecide={canDecide}
            status={approval.status}
          />
        </div>

        <div className="space-y-4">
          <section className="cyber-panel">
            <h2 className="cyber-heading text-lg">Details</h2>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-400">Priority</dt>
              <dd className="capitalize text-slate-200">{approval.priority}</dd>
              <dt className="text-slate-400">Status</dt>
              <dd className="capitalize text-slate-200">{approval.status}</dd>
              <dt className="text-slate-400">Created</dt>
              <dd className="text-slate-200">{formatDateTime(approval.created_at)}</dd>
              {approval.approved_at ? (
                <>
                  <dt className="text-slate-400">Approved</dt>
                  <dd className="text-slate-200">{formatDateTime(approval.approved_at)}</dd>
                </>
              ) : null}
              {approval.rejected_at ? (
                <>
                  <dt className="text-slate-400">Rejected</dt>
                  <dd className="text-slate-200">{formatDateTime(approval.rejected_at)}</dd>
                </>
              ) : null}
            </dl>
          </section>

          {timeline.length > 0 ? (
            <section className="cyber-panel">
              <h2 className="cyber-heading text-lg">Activity</h2>
              <ol className="mt-4 space-y-3">
                {timeline.map((event, index) => (
                  <li key={event.id ?? index} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                    <div>
                      <p className="text-slate-300">
                        {(event.event_type ?? "updated").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRelativeTime(event.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>

      <Link href="/portal/approvals" className="cyber-button-secondary">
        Back to approvals
      </Link>
    </div>
  );
}
