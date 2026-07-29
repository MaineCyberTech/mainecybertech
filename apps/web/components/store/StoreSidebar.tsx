"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories } from "@/lib/catalog/loader";
import { useState } from "react";

export default function StoreSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const categories = getCategories();

  if (!pathname?.startsWith("/store")) return null;

  const currentCategory = pathname.match(/^\/store\/category\/(.+)/)?.[1];

  const sidebarContent = (
    <nav aria-label="Service categories">
      <div className="mb-4">
        <Link
          href="/store"
          className={`block rounded px-3 py-2 text-sm font-semibold uppercase tracking-wider transition ${pathname === "/store" ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
        >
          All Services
        </Link>
      </div>
      <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        Categories
      </h3>
      <div className="mb-4 space-y-0.5">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/store/category/${cat.slug}`}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-sm transition ${currentCategory === cat.slug ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
          >
            <span>{cat.name}</span>
            <span className="text-[10px] text-slate-500">{cat.count}</span>
          </Link>
        ))}
      </div>
      <h3 className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
        Tools
      </h3>
      <div className="space-y-0.5">
        {[
          { href: "/store/quiz", label: "Service Finder" },
          { href: "/store/compare", label: "Compare Services" },
          { href: "/store/quote", label: "Quote Builder" },
          { href: "/store/promotions", label: "Promotions" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded px-3 py-1.5 text-sm transition ${pathname === item.href || (item.href !== "/store" && pathname?.startsWith(item.href)) ? "bg-emerald-600/20 text-emerald-400" : "text-slate-300 hover:bg-white/5"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="rounded-lg border border-white/10 bg-[#0F172A]/60 p-4 backdrop-blur-sm">
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
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

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
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
    </>
  );
}
