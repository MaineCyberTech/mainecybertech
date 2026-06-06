
"use client";

import { useState } from "react";
import { signupAction } from "@/lib/auth/auth-actions";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMsg("");

    const result = await signupAction(email, password, fullName);

    setLoading(false);

    if (result?.error) {
      setErrorMsg(result.error);
      return;
    }

    setMessage("Check your email to confirm your account, then return to continue.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
          Create Secure Account
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign up with your business email. Verified users are reviewed for client access approval.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Full Name
            </label>
            <input
              className="w-full rounded-md border border-white/10 bg-[#0A1118]/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

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

          {errorMsg ? (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {errorMsg}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-md border border-emerald-600/20 bg-emerald-600/10 p-3 text-sm text-emerald-300">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg border-2 border-emerald-600 bg-emerald-600 px-4 py-3 font-orbitron text-xs font-bold uppercase tracking-[0.18em] text-[#0A1118] transition-all duration-300 hover:bg-transparent hover:text-emerald-500"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already have access?{" "}
          <a href="/login" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
