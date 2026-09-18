"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";

type SidebarShellProps = {
  children: ReactNode;
  content: ReactNode;
  navLabel: string;
  brandLabel: string;
};

export default function SidebarShell({
  children,
  content,
  navLabel,
  brandLabel,
}: SidebarShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const closeDrawer = useCallback((restoreFocus = true) => {
    setDrawerOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = () => setDrawerOpen(false);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Focus management + keyboard handling while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;

    // Move focus into the drawer on open.
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      // Basic focus trap: cycle Tab within the drawer.
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Mobile: fixed left sidebar toggle */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 flex h-full flex-col lg:hidden">
        <button
          ref={toggleRef}
          onClick={() => setDrawerOpen(true)}
          className="pointer-events-auto flex w-9 flex-col items-center gap-1 rounded-r-lg border border-l-0 border-white/10 bg-slate-900/80 px-1.5 py-3 text-xs font-bold uppercase tracking-widest text-emerald-400 shadow-lg backdrop-blur-sm transition hover:bg-slate-900"
          style={{ marginTop: "80px" }}
          aria-label={navLabel}
          aria-expanded={drawerOpen}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <span className="text-[8px] tracking-[0.15em] [writing-mode:vertical-rl]">Menu</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => closeDrawer()}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            className="relative flex h-full w-72 flex-col bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                <span className="text-emerald-400">{brandLabel}</span> Menu
              </span>
              <button
                ref={closeRef}
                onClick={() => closeDrawer()}
                className="rounded p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => closeDrawer(false)}>
              {content}
            </div>
          </div>
        </div>
      )}

      {/* Desktop: sticky sidebar */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-28 rounded-lg border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm">
          {content}
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
