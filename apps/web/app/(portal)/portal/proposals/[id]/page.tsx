import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { submitProposalAction } from "./actions";

import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import CommentBody from "@/components/CommentBody";

export const metadata = { title: "Proposal Details - Portal - Maine CyberTech" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function formatRelative(value?: string | null): string {
  if (!value) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}

function statusClass(status: string): string {
  const base =
    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";
  const styles: Record<string, string> = {
    draft: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    sent: "border-blue-500/25 bg-blue-500/10 text-blue-300",
    approved: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    rejected: "border-red-500/25 bg-red-500/10 text-red-300",
    expired: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };
  return `${base} ${styles[status] || "border-white/10 bg-white/5 text-slate-300"}`;
}

function phaseStatusClass(status: string): string {
  const base =
    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";
  const styles: Record<string, string> = {
    not_started: "border-slate-500/25 bg-slate-500/10 text-slate-300",
    in_progress: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    skipped: "border-slate-500/25 bg-slate-500/10 text-slate-300",
  };
  return `${base} ${styles[status] || "border-white/10 bg-white/5 text-slate-300"}`;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalProposalDetailPage({ params }: Props) {
  const { id } = await params;
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) notFound();

  const api = getApiClient();
  const orgId = membership.organization_id as string;

  let proposal: any = null;
  try {
    proposal = await api.proposals.get(id);
  } catch {
    notFound();
  }

  const phases = proposal.phases ?? [];
  const items = proposal.items ?? [];
  const comments = proposal.comments ?? [];
  const timeline = proposal.timeline ?? [];

  const isClientVisible = proposal.visibility === "client_visible";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Breadcrumbs
            items={[
              { label: "Portal", href: "/portal/dashboard" },
              { label: "Proposals", href: "/portal/proposals" },
              { label: proposal.title },
            ]}
          />
          <h1 className="cyber-heading mt-2 text-2xl">{proposal.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {fmtCurrency(proposal.grand_total ?? 0)} total
            {proposal.valid_until && (
              <span> • Valid until {formatRelative(proposal.valid_until)}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={statusClass(proposal.status)}>{proposal.status}</span>
          {isClientVisible && (
            <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              Client Visible
            </span>
          )}
          {proposal.valid_until && (
            <span className="inline-flex min-h-8 items-center rounded-full border border-slate-500/25 bg-slate-500/10 px-3 py-1 text-[11px] font-semibold text-slate-300">
              Valid: {formatRelative(proposal.valid_until)}
            </span>
          )}
        </div>
      </div>

      {proposal.description && (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Description</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{proposal.description}</p>
        </section>
      )}

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Phases & Line Items</h2>
        <div className="mt-6 space-y-6">
          {phases.length > 0 ? (
            phases.map((phase: any) => (
              <div key={phase.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="cyber-heading text-base">{phase.title}</h3>
                  <span className={phaseStatusClass(phase.status || "not_started")}>
                    {phase.status || "not_started"}
                  </span>
                </div>
                {phase.description && (
                  <p className="mt-3 text-sm text-slate-400">{phase.description}</p>
                )}
                {phase.assumptions && (
                  <p className="mt-3 text-sm text-slate-500">
                    <strong>Assumptions:</strong> {phase.assumptions}
                  </p>
                )}
                <div className="mt-4 space-y-3">
                  {items
                    .filter((item: any) => item.phase_id === phase.id)
                    .map((item: any) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-50">{item.name}</p>
                          {item.description && (
                            <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>
                            {item.quantity} × {fmtCurrency(item.unit_price)}
                          </span>
                          <span className="font-medium text-slate-50">
                            {fmtCurrency(item.total_price)}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                            {item.item_type}
                          </span>
                          {item.is_optional && (
                            <span className="inline-flex min-h-8 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300">
                              Optional
                            </span>
                          )}
                          {item.is_recurring && (
                            <span className="inline-flex min-h-8 items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-300">
                              {item.recurring_interval}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="No phases"
              description="Phases will appear here when added."
            />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3">
          <h2 className="cyber-heading text-lg">Totals</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Labor</p>
            <p className="font-orbitron mt-3 text-xl text-slate-50">
              {fmtCurrency(proposal.total_labor ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Materials</p>
            <p className="font-orbitron mt-3 text-xl text-slate-50">
              {fmtCurrency(proposal.total_materials ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Recurring</p>
            <p className="font-orbitron mt-3 text-xl text-slate-50">
              {fmtCurrency(proposal.total_recurring ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">One-Time</p>
            <p className="font-orbitron mt-3 text-xl text-slate-50">
              {fmtCurrency(proposal.total_one_time ?? 0)}
            </p>
          </div>
        </div>
        <div className="mt-6 text-right">
          <p className="font-orbitron text-2xl text-emerald-400">
            Grand Total: {fmtCurrency(proposal.grand_total ?? 0)}
          </p>
        </div>
      </section>

      {comments.length > 0 && (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Comments</h2>
          <div className="mt-6 space-y-4">
            {comments.map((comment: any) => (
              <div
                key={comment.id}
                className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
              >
                <CommentBody body={comment.body} className="markdown-body text-sm text-slate-300" />
                <p className="mt-2 text-xs text-slate-400">
                  {comment.is_internal ? "🔒 Internal — " : ""}
                  {comment.author?.full_name ?? comment.author?.email ?? "Unknown"} •{" "}
                  {formatRelative(comment.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {timeline.length > 0 && (
        <section className="cyber-panel">
          <h2 className="cyber-heading text-lg">Activity Timeline</h2>
          <div className="mt-6 space-y-3">
            {timeline.slice(0, 20).map((event: any) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#0A1118]/60 px-4 py-3"
              >
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300">{event.event_type}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatRelative(event.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-end gap-3">
        {proposal.status === "sent" && (
          <form action={submitProposalAction as unknown as (fd: FormData) => void}>
            <input type="hidden" name="proposalId" value={id} />
            <input type="hidden" name="organizationId" value={orgId} />
            <button type="submit" className="cyber-button">
              Approve Proposal
            </button>
          </form>
        )}
        <Link href="/portal/proposals" className="cyber-button-secondary">
          Back to Proposals
        </Link>
      </div>
    </div>
  );
}
