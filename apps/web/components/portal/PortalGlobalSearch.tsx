"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getClientApi } from "@/lib/client-api";

type SearchResult = {
  tickets: Array<{ id: string; title: string; status: string; priority: string }>;
  projects: Array<{ id: string; name: string; status: string; priority: string }>;
};

export default function PortalGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults(null); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await getClientApi().search.portal(query, "");
        setResults(result);
        setOpen(true);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function resultCount() {
    if (!results) return 0;
    return results.tickets.length + results.projects.length;
  }

  function pill(text: string, color: "emerald" | "amber" | "slate" = "slate") {
    const colors = { emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300", amber: "border-amber-500/20 bg-amber-500/10 text-amber-300", slate: "border-white/10 bg-white/5 text-slate-300" };
    return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] leading-none ${colors[color]}`}>{text}</span>;
  }

  return (
    <div className="relative w-full max-w-sm">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results && resultCount() > 0 && setOpen(true)}
        placeholder="Search tickets, projects..."
        className="w-full rounded-lg border border-white/10 bg-[#0A1118]/80 px-4 py-2.5 pl-10 text-sm text-slate-50 outline-none transition focus:border-emerald-600"
      />
      <svg className="absolute left-3 top-3 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {loading && <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />}

      {open && results && resultCount() > 0 ? (
        <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-white/10 bg-[#0F1923] shadow-2xl backdrop-blur-xl overflow-hidden">
          {results.tickets.length > 0 ? (
            <div className="p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Tickets</p>
              {results.tickets.map((t) => (
                <Link key={t.id} href={`/portal/support/${t.id}`} onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 transition hover:bg-white/5">
                  <p className="text-sm font-medium text-slate-200 truncate mr-3">{t.title}</p>
                  <div className="flex gap-2 shrink-0">
                    {pill(t.status)}
                    {pill(t.priority, t.priority === "urgent" ? "amber" : "slate")}
                  </div>
                </Link>
              ))}
            </div>
          ) : null}

          {results.projects.length > 0 ? (
            <div className="border-t border-white/5 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">Projects</p>
              {results.projects.map((p) => (
                <Link key={p.id} href={`/portal/projects/${p.id}`} onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 transition hover:bg-white/5">
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <div className="flex gap-2">{pill(p.status)}{pill(p.priority)}</div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {open && query.length >= 2 && resultCount() === 0 && !loading ? (
        <div ref={dropdownRef} className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-white/10 bg-[#0F1923] p-4 text-center text-sm text-slate-500">
          No results found for &ldquo;{query}&rdquo;
        </div>
      ) : null}
    </div>
  );
}
