"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getClientApi } from "@/lib/client-api";

const MODULES = [
  "tickets",
  "projects",
  "documents",
  "billing",
  "system",
] as const;

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  module: string;
  module_id?: string | null;
  created_at: string;
};

type Props = {
  basePath: string;
  initialUnread?: number;
};

export default function NotificationBell({
  basePath,
  initialUnread = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchUnread = useCallback(async () => {
    try {
      const result = await getClientApi().notifications.unreadCount();
      setUnread(result.count);
    } catch {
      /* ignore */
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const result = await getClientApi().notifications.list({
        limit: 5,
        unread: true,
      });
      setNotifications(result.items as NotificationItem[]);
    } catch {
      /* ignore */
    }
  }, []);

  const playNotificationChime = useCallback(() => {
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUnread();

    // Connect to SSE stream
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const url = `${baseUrl}/api/v1/notifications/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener("notification", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data) && data.length > 0) {
          // Fetch fresh count from server instead of adding to local state
          fetchUnread();
          fetchRecent();
          playNotificationChime();
        }
      } catch {
        /* ignore */
      }
    });

    es.onerror = () => {
      // Fallback to polling if SSE fails
      es.close();
      const fallbackInterval = setInterval(fetchUnread, 30000);
      return () => clearInterval(fallbackInterval);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchUnread, fetchRecent, playNotificationChime]);

  const fetchPrefs = useCallback(async () => {
    setLoadingPrefs(true);
    try {
      const result = await getClientApi().notifications.listPreferences();
      const rows: any[] = Array.isArray(result)
        ? result
        : ((result as any)?.preferences ?? []);
      const map: Record<string, boolean> = {};
      for (const m of MODULES) {
        const row = rows.find(
          (r: any) => r.module_key === m && r.channel === "email",
        );
        map[m] = row ? row.enabled : true;
      }
      setPrefs(map);
    } catch {
      /* ignore */
    }
    setLoadingPrefs(false);
  }, []);

  useEffect(() => {
    if (open) {
      fetchRecent();
      fetchPrefs();
    }
  }, [open, fetchRecent, fetchPrefs]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleMarkAllRead() {
    try {
      await getClientApi().notifications.markAllRead();
    } catch {
      /* ignore */
    }
    await fetchUnread();
    await fetchRecent();
  }

  async function handleMarkRead(id: string) {
    try {
      await getClientApi().notifications.markRead(id);
    } catch {
      /* ignore */
    }
    await fetchUnread();
    await fetchRecent();
  }

  async function handleTogglePref(moduleKey: string, enabled: boolean) {
    setPrefs((prev) => ({ ...prev, [moduleKey]: enabled }));
    try {
      await getClientApi().notifications.updatePreferences({
        preferences: [{ moduleKey, channel: "email", enabled }],
      });
    } catch {
      /* ignore */
    }
  }

  const moduleHref = (n: NotificationItem) => {
    if (n.module === "tickets" && n.module_id)
      return `${basePath}/tickets/${n.module_id}`;
    if (n.module === "projects" && n.module_id)
      return `${basePath}/projects/${n.module_id}`;
    if (n.module === "documents" && n.module_id)
      return `${basePath}/documents/${n.module_id}`;
    return "#";
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg border-2 border-emerald-600 bg-transparent p-2.5 text-emerald-500 transition-all hover:bg-emerald-600/10"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-white/10 bg-[#0A1118] shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-slate-200">
              Notifications
            </span>
            {notifications.length > 0 ? (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No new notifications
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="group border-b border-white/5 px-4 py-3 transition hover:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={moduleHref(n)}
                      onClick={() => handleMarkRead(n.id)}
                      className="min-w-0 flex-1"
                    >
                      <p className="text-sm font-medium text-slate-200">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-600">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(n.id);
                      }}
                      className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition hover:text-slate-300 group-hover:opacity-100"
                      title="Dismiss"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="border-t border-white/10 px-4 py-2">
              <Link
                href={`${basePath}/notifications`}
                onClick={() => setOpen(false)}
                className="block text-center text-xs text-emerald-400 hover:text-emerald-300"
              >
                View all notifications
              </Link>
            </div>
          ) : null}

          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Email Preferences
              </span>
              <Link
                href={`${basePath}/notifications/preferences`}
                onClick={() => setOpen(false)}
                className="text-[10px] text-emerald-500 hover:text-emerald-400"
              >
                Full Settings
              </Link>
            </div>
            {loadingPrefs ? (
              <p className="mt-2 text-xs text-slate-500">Loading...</p>
            ) : (
              <div className="mt-2 space-y-1">
                {MODULES.map((m) => (
                  <label
                    key={m}
                    className="flex items-center justify-between rounded px-1 py-1 transition hover:bg-white/[0.02]"
                  >
                    <span className="text-xs capitalize text-slate-300">
                      {m === "system" ? "System" : m}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={prefs[m] ?? true}
                      onClick={() => handleTogglePref(m, !(prefs[m] ?? true))}
                      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${(prefs[m] ?? true) ? "bg-emerald-600" : "bg-white/10"}`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${(prefs[m] ?? true) ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
