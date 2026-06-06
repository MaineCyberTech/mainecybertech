"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

export default function PasswordResetPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await getClientApi().auth.resetPassword(email, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        {done ? (
          <>
            <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Password Reset</h1>
            <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
              <p>Your password has been reset successfully. Redirecting to login...</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">Set New Password</h1>
            <p className="mt-3 text-sm text-slate-400">Enter your email and new password.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Email</label>
                <input type="email" placeholder="name@clientdomain.com" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">New Password</label>
                <input type="password" placeholder="Min 6 characters" required value={password} minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg border-2 border-emerald-600 bg-emerald-600 px-4 py-3 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-[#0A1118] transition-all duration-300 hover:bg-transparent hover:text-emerald-500">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <p className="text-center text-sm text-slate-400">
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300">Back to Login</Link>
              </p>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
