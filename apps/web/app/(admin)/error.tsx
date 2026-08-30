"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/auth/auth-actions";
import { clientLogger } from "@/lib/client-logger";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    clientLogger.errorWithContext(
      { area: "admin", digest: error.digest },
      error,
    );
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <svg
          className="h-8 w-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-slate-100">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        An unexpected error occurred in the admin panel. Please try again.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Try again
        </button>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-white/15 bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700"
          >
            Log out
          </button>
        </form>
        <Link
          href="/login"
          className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          Back to login
        </Link>
      </div>
      <details className="mx-auto mt-8 max-w-xl text-left text-sm text-slate-400">
        <summary className="cursor-pointer">Error details</summary>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-900/60 p-3">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      </details>
    </div>
  );
}
