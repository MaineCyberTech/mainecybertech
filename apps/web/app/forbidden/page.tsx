import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied | Maine CyberTech Portal",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-base px-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-3xl font-bold text-red-400">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-100">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          You do not have permission to view this page. If you believe this is an error, contact
          your organization administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/portal/dashboard"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
