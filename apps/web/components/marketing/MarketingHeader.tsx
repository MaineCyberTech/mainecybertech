"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services/networks", label: "Networks" },
  { href: "/services/security-systems", label: "Security Systems" },
  { href: "/services/it-support", label: "IT Support" },
  { href: "/services/cloud", label: "Cloud" },
  { href: "/services/cybersecurity", label: "Cybersecurity" },
];

export default function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-emerald-600/20 bg-[#0A1118]/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <span className="font-orbitron text-lg font-bold uppercase tracking-wider text-slate-50 sm:text-xl">
            Maine <span className="text-emerald-500 drop-shadow-[0_0_10px_rgba(5,150,105,0.4)]">CyberTech</span>
          </span>
        </Link>

        <button
          className="flex flex-col gap-[5px] sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`h-0.5 w-7 bg-slate-50 transition ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`h-0.5 w-7 bg-slate-50 transition ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-7 bg-slate-50 transition ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>

        <nav className={`${menuOpen ? "flex" : "hidden"} absolute left-0 top-full w-full flex-col border-b border-emerald-600/20 bg-[#0A1118]/95 px-6 pb-6 pt-4 backdrop-blur-md sm:static sm:flex sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-widest no-underline transition sm:py-1 ${
                isActive(item.href)
                  ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(5,150,105,0.5)]"
                  : "text-slate-50 hover:text-emerald-400"
              }`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-600 sm:bottom-0" />
              )}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-3 rounded border border-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-500 no-underline transition hover:bg-emerald-600/10 hover:shadow-[0_0_15px_rgba(5,150,105,0.4)] sm:ml-4 sm:mt-0"
          >
            Contact Us
          </Link>
          <Link
            href="/login"
            className="mt-2 rounded bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0A1118] no-underline transition hover:bg-emerald-500 sm:ml-2 sm:mt-0"
          >
            Portal
          </Link>
        </nav>
      </div>
    </header>
  );
}
