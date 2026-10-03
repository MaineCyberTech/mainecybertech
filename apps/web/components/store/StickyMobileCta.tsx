"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StickyMobileCtaProps {
  href: string;
  label: string;
  /** Only reveal after this many pixels of scroll. */
  revealAfter?: number;
}

/**
 * Prompt 17 mobile sticky CTA.
 *
 * Mobile-only, dismissible, and never covers content: it appears only after the
 * visitor scrolls past the hero, sits in a `pointer-events-none` wrapper so taps
 * outside the button pass through, and reserves no space over the page footer
 * because it can be dismissed. It does not render at all on `lg` and up.
 */
export default function StickyMobileCta({ href, label, revealAfter = 600 }: StickyMobileCtaProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > revealAfter);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfter]);

  if (dismissed || !visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Quick action"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden"
    >
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-lg border border-emerald-600/30 bg-[#0A1118]/95 p-3 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] backdrop-blur">
        <Link
          href={href}
          className="flex-1 rounded border-2 border-emerald-600 bg-emerald-600 px-4 py-2.5 text-center font-display text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss quick action"
          className="rounded p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
