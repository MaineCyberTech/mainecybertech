"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/auth/auth-actions";
import { Button } from "@mct/ui/components/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const result = await loginAction(email, password);

    setLoading(false);

    if (result?.error) {
      setErrorMsg(result.error);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
          Secure Login
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign in to access your Maine CyberTech client portal.
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Work Email
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@clientdomain.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Password
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Forgot password?
            </Link>
          </div>

          {errorMsg ? (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMsg}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            className="w-full"
          >
            {loading ? "Signing In..." : "Secure Login"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Need an account?{" "}
          <a href="/signup" className="text-emerald-400 hover:text-emerald-300">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
