"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import StoreSidebarContent from "@/components/store/StoreSidebar";

export default function StoreLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Mobile: hamburger + drawer */}
      <div className="lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="mb-3 mt-20 flex w-full items-center gap-2 rounded border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-sm text-slate-300"
          aria-label="Browse categories"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          Browse Categories
        </button>

        {drawerOpen && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <div className="relative ml-auto flex h-full w-72 flex-col bg-[#0F172A] p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm font-semibold text-slate-200">Store</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-slate-400 hover:text-white"
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
              <div className="mt-4 flex-1 overflow-y-auto">
                <StoreSidebarContent />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-28 rounded-lg border border-white/10 bg-[#0F172A]/60 p-4 backdrop-blur-sm">
          <StoreSidebarContent />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
