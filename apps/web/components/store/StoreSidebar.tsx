"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories } from "@/lib/catalog/loader";
import { useState } from "react";

export default function StoreSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const categories = getCategories();

  // Only show on store pages
  if (!pathname?.startsWith("/store")) return null;

  const currentCategory = pathname.match(/^\/store\/category\/(.+)/)?.[1];

  const sidebarContent = (
    <nav aria-label="Service categories">
      <div className="mb-6">
        <Link
          href="/store"
          className={`block rounded px-3 py-2 text-sm font-semibold uppercase tracking-wider transition ${pathname === "/store" ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          All Services
        </Link>
      </div>
      <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        Categories
      </h3>
      <div className="space-y-1">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/store/category/${cat.slug}`}
            className={`flex items-center justify-between rounded px-3 py-2 text-sm transition ${currentCategory === cat.slug ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
          >
            <span>{cat.name}</span>
            <span className="text-[10px] text-slate-500">{cat.count}</span>
          </Link>
        ))}
      </div>
      <div className="mt-6 space-y-1">
        <h3 className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          Tools
        </h3>
        <Link
          href="/store/quiz"
          className={`block rounded px-3 py-2 text-sm transition ${pathname === "/store/quiz" ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          Service Finder
        </Link>
        <Link
          href="/store/compare"
          className={`block rounded px-3 py-2 text-sm transition ${pathname?.startsWith("/store/compare") ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          Compare Services
        </Link>
        <Link
          href="/store/quote"
          className={`block rounded px-3 py-2 text-sm transition ${pathname === "/store/quote" ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          Quote Builder
        </Link>
        <Link
          href="/store/promotions"
          className={`block rounded px-3 py-2 text-sm transition ${pathname === "/store/promotions" ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          Promotions
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-2 rounded border border-white/10 bg-[#0A1118]/60 px-4 py-2 text-sm text-slate-300 lg:hidden"
        aria-label="Browse categories"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        Browse Categories
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative ml-auto flex h-full w-72 flex-col bg-[#0F172A] p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-sm font-semibold text-slate-200">Store</span>
              <button
                onClick={() => setOpen(false)}
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
            <div className="mt-4 flex-1 overflow-y-auto">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-28 rounded-lg border border-white/10 bg-[#0F172A]/60 p-4 backdrop-blur-sm">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
