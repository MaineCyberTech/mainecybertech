"use client";

import { useState } from "react";
import Link from "next/link";
import { getClientApi } from "@/lib/client-api";
import { Button } from "@mct/ui/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await getClientApi().auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
          Reset Password
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Enter your email to receive a password reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
            <p>
              If an account exists with that email, a reset link has been sent.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                Work Email
              </label>
              <input
                type="email"
                placeholder="name@clientdomain.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <p className="text-center text-sm text-slate-400">
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300"
              >
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
