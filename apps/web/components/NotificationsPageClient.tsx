"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getClientApi } from "@/lib/client-api";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  module: string;
  module_id?: string | null;
  action: string;
  read: boolean;
  read_at?: string | null;
  created_at: string;
};

type Props = {
  basePath: string;
  initialPage?: number;
};

const PAGE_SIZE = 20;

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  assigned: "Assigned",
  due_soon: "Due Soon",
  overdue: "Overdue",
  comment: "Comment",
  mention: "Mention",
  status_change: "Status Change",
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  updated: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  assigned: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  due_soon: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
  comment: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  mention: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  status_change: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function NotificationsPageClient({ basePath, initialPage = 1 }: Props) {
  const [page, setPage] = useState(initialPage);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  const [filterModule, setFilterModule] = useState<string>("");

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getClientApi().notifications.list({
        page,
        limit: PAGE_SIZE,
        unread: filterRead === "unread" ? true : undefined,
      });
      setNotifications(result.items);
      setTotal(result.total);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filterRead]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  async function markRead(id: string) {
    await getClientApi().notifications.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n));
  }

  async function markAllRead() {
    await getClientApi().notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, read_at: new Date().toISOString() })));
  }

  const moduleHref = (n: NotificationItem) => {
    if (!n.module_id) return "#";
    if (n.module === "tickets") return `${basePath}/tickets/${n.module_id}`;
    if (n.module === "projects") return `${basePath}/projects/${n.module_id}`;
    if (n.module === "documents") return `${basePath}/documents/${n.module_id}`;
    return "#";
  };

  const filtered = filterModule
    ? notifications.filter((n) => n.module === filterModule)
    : notifications;

  const filteredByRead = filterRead === "read"
    ? filtered.filter((n) => n.read)
    : filterRead === "unread"
      ? filtered.filter((n) => !n.read)
      : filtered;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <select value={filterRead} onChange={(e) => { setFilterRead(e.target.value as any); setPage(1); }}
          className="cyber-input text-xs w-auto">
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>

        <select value={filterModule} onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
          className="cyber-input text-xs w-auto">
          <option value="">All modules</option>
          <option value="tickets">Tickets</option>
          <option value="projects">Projects</option>
          <option value="documents">Documents</option>
          <option value="billing">Billing</option>
          <option value="system">System</option>
        </select>

        <span className="text-xs text-slate-500">{total} total</span>

        {notifications.some((n) => !n.read) ? (
          <button onClick={markAllRead} className="cyber-button-secondary text-xs">
            Mark all read
          </button>
        ) : null}

        <Link href={`${basePath}/notifications/preferences`} className="cyber-button-secondary text-xs ml-auto">
          Preferences
        </Link>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading...</div>
        ) : filteredByRead.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">No notifications found.</div>
        ) : (
          filteredByRead.map((n) => (
            <div key={n.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition ${
                n.read ? "border-white/5 bg-[#0A1118]/40" : "border-emerald-500/20 bg-[#0A1118]/70"
              }`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${ACTION_COLORS[n.action] ?? "border-white/10 text-slate-400"}`}>
                    {ACTION_LABELS[n.action] ?? n.action}
                  </span>
                  {n.read ? null : <span className="h-2 w-2 rounded-full bg-emerald-500" />}
                </div>
                <Link href={moduleHref(n)} onClick={() => { if (!n.read) markRead(n.id); }}
                  className="mt-2 block">
                  <p className="font-medium text-slate-50">{n.title}</p>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{n.body}</p>
                </Link>
                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-600">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  <span className="capitalize">{n.module}</span>
                  {n.read_at ? <span>Read {new Date(n.read_at).toLocaleString()}</span> : null}
                </div>
              </div>
              {!n.read ? (
                <button onClick={() => markRead(n.id)}
                  className="shrink-0 rounded p-1 text-slate-600 hover:text-slate-300" title="Mark read">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="cyber-button-secondary text-xs disabled:opacity-30">
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (page <= 4) {
              pageNum = i + 1;
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = page - 3 + i;
            }
            return (
              <button key={pageNum} onClick={() => setPage(pageNum)}
                className={`h-8 w-8 rounded text-xs font-medium transition ${
                  pageNum === page ? "bg-emerald-600/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                }`}>
                {pageNum}
              </button>
            );
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="cyber-button-secondary text-xs disabled:opacity-30">
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
