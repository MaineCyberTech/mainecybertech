"use client";

import Link from "next/link";

export default function KnowledgeBaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Logged here (server render of the boundary) so the real error — not the
  // production-omitted client message — surfaces in server logs/CI.
  console.error("KB page render error:", error);

  return (
    <div className="space-y-4" role="alert">
      <h1 className="text-2xl font-semibold text-slate-50">Knowledge Base</h1>
      <p className="text-sm text-slate-400">
        Something went wrong while loading the knowledge base. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Try again
        </button>
        <Link
          href="/portal/dashboard"
          className="text-sm text-emerald-500 hover:text-emerald-400"
        >
          &larr; Dashboard
        </Link>
      </div>
    </div>
  );
}
