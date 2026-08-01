"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";

type SidebarShellProps = {
  children: ReactNode;
  content: ReactNode;
  navLabel: string;
  brandLabel: string;
};

export default function SidebarShell({ children, content, navLabel, brandLabel }: SidebarShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setDrawerOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Mobile: fixed left sidebar toggle */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 flex h-full flex-col lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="pointer-events-auto flex w-9 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-white/10 bg-[#0F172A]/80 px-1.5 py-3 text-xs font-bold uppercase tracking-widest text-emerald-400 shadow-lg backdrop-blur-sm transition hover:bg-[#0F172A]"
          style={{ marginTop: "80px" }}
          aria-label={navLabel}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[8px] tracking-[0.15em] [writing-mode:vertical-rl]">Menu</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/70" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-[#0F172A] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                <span className="text-emerald-400">{brandLabel}</span> Menu
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => setDrawerOpen(false)}>
              {content}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sticky sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-28 rounded-lg border border-white/10 bg-[#0F172A]/60 p-4 backdrop-blur-sm">
          {content}
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
