"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePermissions } from "@/lib/use-permissions";

export type GuardRule = { module: string; action?: string };

/**
 * Client-side route guard. Matches the current pathname against a
 * prefix -> permission map and renders a 403 panel when the active
 * session lacks the required `module:action` permission.
 *
 * This is a UX/defense-in-depth layer; server components and the API
 * enforce the same rules independently.
 */
export default function RouteGuard({
  children,
  rules,
  homeHref,
}: {
  children: ReactNode;
  rules: Record<string, GuardRule>;
  homeHref: string;
}) {
  const pathname = usePathname();
  const { can, loading } = usePermissions();

  const required = Object.entries(rules).find(([prefix]) =>
    prefix === "/" ? pathname === homeHref : pathname.startsWith(prefix),
  );

  const allowed = !required || loading || can(required[1].module, required[1].action ?? "view");

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-[#0F172A]/80 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-xl font-bold text-red-400">
          403
        </div>
        <h1 className="text-lg font-bold text-slate-100">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          Your current role does not include permission to access this module.
        </p>
        <div className="mt-6">
          <Link
            href={homeHref}
            className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
