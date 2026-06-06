import Link from "next/link";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import AdminSubnav from "@/components/admin/AdminSubnav";
import {
  updateTicketAction,
  addCommentAction,
  deleteTicketAction,
  restoreTicketAction,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ticket Details - Admin - Maine CyberTech" };

const DELETED_PREFIX = "[Deleted] ";

function storedTicketTitle(ticket: any) {
  return String(ticket?.title ?? ticket?.subject ?? ticket?.name ?? `Ticket ${ticket?.id}`);
}

function displayTicketTitle(ticket: any) {
  const title = storedTicketTitle(ticket);
  return title.startsWith(DELETED_PREFIX) ? title.slice(DELETED_PREFIX.length) : title;
}

function ticketDescription(ticket: any) {
  return ticket?.description ?? ticket?.details ?? ticket?.body ?? ticket?.message ?? "No description provided.";
}

function ticketCategory(ticket: any) {
  return ticket?.category ?? ticket?.type ?? ticket?.classification ?? "Uncategorized";
}

function ticketStatus(ticket: any) {
  return String(ticket?.status ?? ticket?.state ?? ticket?.ticket_status ?? "new").toLowerCase();
}

function ticketPriority(ticket: any) {
  return String(ticket?.priority ?? ticket?.severity ?? "normal").toLowerCase();
}

function isDeletedTicket(ticket: any) {
  return Boolean(ticket?.is_deleted ?? ticket?.deleted ?? ticket?.deleted_at ?? ticket?.archived_at) || storedTicketTitle(ticket).startsWith(DELETED_PREFIX);
}

function commentBody(comment: any) {
  return comment?.body ?? comment?.comment ?? comment?.message ?? "";
}

function commentInternal(comment: any) {
  return Boolean(comment?.is_internal ?? comment?.internal_only ?? false);
}

function commentAuthor(comment: any) {
  return comment?.author_name ?? comment?.created_by_name ?? comment?.author_email ?? comment?.created_by ?? "Unknown";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(value);
}

function statusClass(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
    case "complete":
    case "completed":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-emerald-300";
    case "triaged":
    case "pending":
    case "waiting":
    case "on_hold":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
    default:
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-blue-300";
  }
}

function priorityClass(priority: string) {
  switch (priority) {
    case "urgent":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-red-300";
    case "high":
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-amber-300";
    default:
      return "inline-flex min-h-9 items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] leading-none text-slate-300";
  }
}

type Props = { params: Promise<{ ticketId: string }>; searchParams: Promise<{ edit?: string; confirmDelete?: string }> };

export default async function AdminTicketDetailPage({ params, searchParams }: Props) {
  await requireAdminAccess();
  const { ticketId } = await params;
  const { edit, confirmDelete } = await searchParams;
  const editMode = edit === "1";
  const showDeleteConfirm = confirmDelete === "1";
  const api = getApiClient();

  let ticket: any;
  try {
    ticket = await api.tickets.get(ticketId);
  } catch {
    return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-red-300">Ticket not found.</div>;
  }

  const deleted = isDeletedTicket(ticket);
  const [organization, rawComments] = await Promise.all([
    api.organizations.get(ticket.organization_id).catch(() => ({ id: ticket.organization_id, name: null })),
    api.tickets.listComments(ticketId),
  ]);
  const comments = rawComments ?? [];
  const status = ticketStatus(ticket);
  const priority = ticketPriority(ticket);

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tickets", href: "/admin/tickets" }, { label: displayTicketTitle(ticket) }]} />
      <AdminSubnav current="tickets" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">{displayTicketTitle(ticket)}</h1>
          <p className="mt-3 text-slate-300">Organization: {organization?.name ?? ticket.organization_id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Ticket ID: {ticket.id}</span>
            {ticket.external_jsm_issue_key ? (
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">{ticket.external_jsm_issue_key}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={statusClass(status)}>{status}</span>
          <span className={priorityClass(priority)}>{priority}</span>
          {editMode ? <Link href={`/admin/tickets/${ticketId}`} className="cyber-button-secondary">Cancel Edit</Link> : <Link href={`/admin/tickets/${ticketId}?edit=1`} className="cyber-button-secondary">Edit Ticket</Link>}
          <Link href={`/portal/support/${ticketId}`} className="cyber-button-secondary">View in Portal</Link>
          {deleted ? (
            <form action={restoreTicketAction.bind(null, ticketId)}><button type="submit" className="cyber-button-secondary">Restore Ticket</button></form>
          ) : (
            <Link href={`/admin/tickets/${ticketId}?confirmDelete=1`} className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20">Delete Ticket</Link>
          )}
          <Link href="/admin/tickets" className="cyber-button-secondary">Back to Tickets</Link>
        </div>
      </div>

      {showDeleteConfirm && !deleted ? (
        <section className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-orbitron text-lg uppercase tracking-[0.12em] text-red-200">Confirm Ticket Deletion</h2>
              <p className="mt-3 max-w-2xl text-sm text-red-100/90">This performs a safer soft-delete so the ticket can be restored later. Type <span className="font-semibold">DELETE</span> below to confirm.</p>
            </div>
            <Link href={`/admin/tickets/${ticketId}`} className="cyber-button-secondary">Cancel</Link>
          </div>
          <form action={deleteTicketAction.bind(null, ticketId)} className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full max-w-sm">
              <label className="cyber-label">Type DELETE to confirm</label>
              <input name="confirmation" className="cyber-input" placeholder="DELETE" required />
            </div>
            <button type="submit" className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20">Confirm Delete</button>
          </form>
        </section>
      ) : null}

      {editMode ? (
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3"><h2 className="cyber-heading text-lg">Edit Ticket</h2><span className="cyber-pill">Admin</span></div>
          <form action={updateTicketAction.bind(null, ticketId)} className="mt-6 space-y-4">
            <div><label className="cyber-label">Title</label><input name="subject" defaultValue={displayTicketTitle(ticket)} className="cyber-input" required /></div>
            <div className="grid gap-4 md:grid-cols-3">
              <div><label className="cyber-label">Status</label><select name="status" defaultValue={status} className="cyber-input"><option value="new">new</option><option value="triaged">triaged</option><option value="pending">pending</option><option value="resolved">resolved</option><option value="closed">closed</option></select></div>
              <div><label className="cyber-label">Priority</label><select name="priority" defaultValue={priority} className="cyber-input"><option value="low">low</option><option value="normal">normal</option><option value="high">high</option><option value="urgent">urgent</option></select></div>
              <div><label className="cyber-label">Category</label><input name="category" defaultValue={ticketCategory(ticket)} className="cyber-input" /></div>
            </div>
            <div><label className="cyber-label">Description</label><textarea name="description" rows={6} className="cyber-input" defaultValue={ticketDescription(ticket)} required /></div>
            <div><button type="submit" className="cyber-button">Save Changes</button></div>
          </form>
        </section>
      ) : (
        <section className="cyber-panel">
          <div className="flex items-center justify-between gap-3"><h2 className="cyber-heading text-lg">Ticket Details</h2><span className="cyber-pill">View</span></div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Category</p><p className="mt-2 text-slate-200">{ticketCategory(ticket)}</p></div>
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Updated</p><p className="mt-2 text-slate-200">{formatDateTime(ticket.updated_at ?? ticket.created_at)}</p></div>
            {ticket.labels?.length ? (
              <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Labels</p><p className="mt-2 flex flex-wrap gap-1">{ticket.labels.map((l: string) => <span key={l} className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-300">{l}</span>)}</p></div>
            ) : null}
            {ticket.resolution ? (
              <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Resolution</p><p className="mt-2 text-slate-200">{ticket.resolution}</p></div>
            ) : null}
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"><p className="text-xs uppercase tracking-[0.12em] text-slate-500">Description</p><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{ticketDescription(ticket)}</p></div>
        </section>
      )}

      <section className="cyber-panel">
        <div className="flex items-center justify-between gap-3"><h2 className="cyber-heading text-lg">Comments</h2><span className="cyber-pill">Total {comments.length}</span></div>
        <div className="mt-6 space-y-4">
          {comments.length > 0 ? comments.map((comment: any) => (
            <div key={comment.id ?? `${comment.created_at}-${commentBody(comment)}`} className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-50">{commentAuthor(comment)}</p>
                {commentInternal(comment) ? <span className="inline-flex min-h-7 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] leading-none text-amber-300">Internal</span> : null}
                <span className="text-xs text-slate-500" title={formatDateTime(comment.created_at)}>{formatRelativeTime(comment.created_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{commentBody(comment)}</p>
            </div>
          )) : <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4 text-slate-400">No comments yet.</div>}
        </div>
        <form action={addCommentAction.bind(null, ticketId, ticket.organization_id)} className="mt-6 space-y-4">
          <div><label className="cyber-label">Add Comment</label><textarea name="body" rows={4} className="cyber-input" placeholder="Add an admin note or client-facing response..." required /></div>
          <div className="flex flex-wrap items-center gap-3"><label className="inline-flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="isInternal" value="true" className="h-4 w-4 rounded border-white/20 bg-transparent" />Internal only</label><button type="submit" className="cyber-button-secondary">Post Comment</button></div>
        </form>
      </section>
    </div>
  );
}
