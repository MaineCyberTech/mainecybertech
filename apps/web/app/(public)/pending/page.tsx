"use client";

import { logoutAction } from "@/lib/auth/auth-actions";
import { Button } from "@mct/ui/components/Button";

export const metadata = { title: "Pending Approval - Maine CyberTech" };

export default function PendingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
          Approval Pending
        </h1>
        <p className="mt-4 text-slate-400">
          Your email is verified, but your organization access is still waiting
          for admin approval.
        </p>

        <div className="mt-6 rounded-lg border border-emerald-600/20 bg-emerald-600/10 p-4 text-sm text-slate-200">
          Once approved, you&rsquo;ll gain access to dashboard, tickets,
          projects, billing, documents, and contracts.
        </div>

        <form action={logoutAction} className="mt-6 inline-block">
          <Button type="submit" variant="primary" className="w-full">
            Sign Out &amp; Return to Login
          </Button>
        </form>
      </div>
    </main>
  );
}
