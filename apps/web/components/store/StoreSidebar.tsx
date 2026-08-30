"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategories } from "@/lib/catalog/loader";

export default function StoreSidebarContent() {
  const pathname = usePathname();
  const categories = getCategories();

  if (!pathname?.startsWith("/store")) return null;

  const currentCategory = pathname.match(/^\/store\/category\/(.+)/)?.[1];

  return (
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
}
