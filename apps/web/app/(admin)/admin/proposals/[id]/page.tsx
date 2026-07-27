import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import AdminSubnav from "@/components/admin/AdminSubnav";
import AdminPageShell from "@/components/admin/AdminPageShell";
import EmptyState from "@/components/EmptyState";
import CommentBody from "@/components/CommentBody";

export const dynamic = "force-dynamic";
export const metadata = { title: "Proposal Detail - Admin - Maine CyberTech" };

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function statusClass(status: string): string {
  const base =
    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]";
  switch (status) {
    case "draft":
      return `${base} border-slate-500/25 bg-slate-500/10 text-slate-300`;
    case "sent":
      return `${base} border-amber-500/25 bg-amber-500/10 text-amber-300`;
    case "approved":
      return `${base} border-emerald-500/25 bg-emerald-500/10 text-emerald-300`;
    case "rejected":
      return `${base} border-red-500/25 bg-red-500/10 text-red-300`;
    case "expired":
      return `${base} border-slate-500/25 bg-slate-500/10 text-slate-300`;
    default:
      return `${base} border-white/10 bg-white/5 text-slate-300`;
  }
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatRelative(value?: string | null): string {
  if (!value) return "—";
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toISOString().slice(0, 10);
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminProposalDetailPage({ params }: Props) {
  await requireAdminAccess();
  const { id } = await params;
  const api = getApiClient();

  let proposal: any = null;

  try {
    proposal = await api.proposals.get(id);
  } catch {
    notFound();
  }

  if (!proposal) notFound();

  const phases = proposal.phases ?? [];
  const items = proposal.items ?? [];
  const comments = proposal.comments ?? [];
  const timeline = proposal.timeline ?? [];

  return (
    <AdminPageShell
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Proposals", href: "/admin/proposals" },
            { label: proposal.title },
          ]}
        />
      }
      subnav={<AdminSubnav current="proposals" />}
      title={proposal.title}
      description={`Status: ${proposal.status} • ${fmtCurrency(proposal.grand_total ?? 0)} total`}
      actions={
        <Link href={`/admin/proposals/${proposal.id}/edit`} className="cyber-button-secondary">
          Edit
        </Link>
      }
    >
      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Proposal Details</h2>
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-slate-400">Status</dt>
          <dd className="text-slate-50">
            <span className={statusClass(proposal.status)}>{proposal.status}</span>
          </dd>
          <dt className="text-slate-400">Visibility</dt>
          <dd className="text-slate-50">{proposal.visibility}</dd>
          <dt className="text-slate-400">Grand Total</dt>
          <dd className="font-orbitron text-lg text-slate-50">
            {fmtCurrency(proposal.grand_total ?? 0)}
          </dd>
          <dt className="text-slate-400">Valid Until</dt>
          <dd className="text-slate-50">
            {proposal.valid_until ? formatDateTime(proposal.valid_until) : "—"}
          </dd>
          <dt className="text-slate-400">Sent At</dt>
          <dd className="text-slate-50">
            {proposal.sent_at ? formatDateTime(proposal.sent_at) : "—"}
          </dd>
          <dt className="text-slate-400">Approved At</dt>
          <dd className="text-slate-50">
            {proposal.approved_at ? formatDateTime(proposal.approved_at) : "—"}
          </dd>
          <dt className="text-slate-400">Owner</dt>
          <dd className="text-slate-50">{proposal.owner_user_id ?? "—"}</dd>
          <dt className="text-slate-400">Created</dt>
          <dd className="text-slate-50">{formatRelative(proposal.created_at)}</dd>
          <dt className="text-slate-400">Updated</dt>
          <dd className="text-slate-50">{formatRelative(proposal.updated_at)}</dd>
        </dl>

        {proposal.description && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Description
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
              {proposal.description}
            </p>
          </div>
        )}

        {proposal.metadata && Object.keys(proposal.metadata).length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Metadata
            </p>
            <pre className="mt-3 max-h-32 overflow-auto rounded bg-slate-900/50 p-2 text-xs">
              {JSON.stringify(proposal.metadata, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Pricing Breakdown</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
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

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Phases</h2>
        <div className="mt-6 space-y-3">
          {phases.length > 0 ? (
            phases.map((phase: any) => (
              <div key={phase.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-50">{phase.title}</p>
                    {phase.description && (
                      <p className="mt-1 text-sm text-slate-400">{phase.description}</p>
                    )}
                    {phase.assumptions && (
                      <p className="mt-1 text-xs text-slate-500">
                        Assumptions: {phase.assumptions}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">Sort: {phase.sort_order}</span>
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
        <h2 className="cyber-heading text-lg">Line Items</h2>
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item: any) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.is_recurring ? "border-cyan-500/25 bg-cyan-500/10 text-cyan-300" : "border-white/10 bg-white/5 text-slate-300"}`}
                    >
                      {item.item_type}
                    </span>
                    <p className="font-medium text-slate-50">{item.name}</p>
                    {item.description && (
                      <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Qty: {item.quantity}</span>
                    <span>Unit: {fmtCurrency(item.unit_price)}</span>
                    <span className="font-medium text-slate-50">
                      Total: {fmtCurrency(item.total_price)}
                    </span>
                    {item.is_optional && <span className="cyber-pill-warning">Optional</span>}
                    {item.is_recurring && (
                      <span className="cyber-pill">Recurring: {item.recurring_interval}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📦"
              title="No line items"
              description="Line items will appear here when added."
            />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Comments</h2>
        <div className="mt-6 space-y-4">
          {comments.length > 0 ? (
            comments.map((comment: any) => (
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
            ))
          ) : (
            <EmptyState icon="💬" title="No comments" description="Comments will appear here." />
          )}
        </div>
      </section>

      <section className="cyber-panel">
        <h2 className="cyber-heading text-lg">Activity Timeline</h2>
        <div className="mt-6 space-y-3">
          {timeline.length > 0 ? (
            timeline.slice(0, 20).map((event: any) => (
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
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="No timeline events"
              description="Timeline events will appear here."
            />
          )}
        </div>
      </section>
    </AdminPageShell>
  );
}
