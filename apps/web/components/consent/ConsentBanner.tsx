"use client";

import Link from "next/link";
import { useConsent } from "./ConsentProvider";

/**
 * PRIV-P2-001: explicit opt-in banner. Accepting or rejecting persists the
 * choice and is the only path that enables the GA/Tawk.to scripts. The banner
 * can be reopened from the footer ("Cookie settings") to change or withdraw
 * the choice.
 */
export default function ConsentBanner() {
  const { bannerOpen, choice, acceptAnalytics, rejectAnalytics, closePreferences } = useConsent();

  if (!bannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-600/30 bg-cyber-base/95 px-4 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.45)] backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <h2
            id="consent-banner-title"
            className="font-display text-sm font-bold uppercase tracking-wider text-slate-50"
          >
            Your privacy choices
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            We use Google Analytics to understand how the site is used and Tawk.to for live chat.
            These third parties are only loaded if you accept. See our{" "}
            <Link
              href="/privacy"
              className="text-emerald-400 underline transition hover:text-emerald-300"
            >
              Privacy Policy
            </Link>{" "}
            for details. You can change your choice at any time via &ldquo;Cookie settings&rdquo; in
            the footer.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {choice && (
            <button
              type="button"
              onClick={closePreferences}
              className="rounded border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300 transition hover:border-white/30 hover:text-slate-100"
            >
              Close
            </button>
          )}
          <button
            type="button"
            onClick={rejectAnalytics}
            className="rounded border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 transition hover:border-white/40 hover:text-white"
          >
            Reject analytics
          </button>
          <button
            type="button"
            onClick={acceptAnalytics}
            className="rounded border-2 border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-cyber-base transition hover:bg-transparent hover:text-emerald-500"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
