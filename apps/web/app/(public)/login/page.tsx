"use client";

import { useState } from "react";
import Link from "next/link";
import {
  loginAction,
  mfaLoginVerifyAction,
  mfaRecoveryLoginAction,
  mfaCancelAction,
} from "@/lib/auth/auth-actions";
import { isTestAccountsEnabled } from "@/lib/test-accounts";
import { Button } from "@mct/ui/components/Button";

const EXPIRED_PENDING_MESSAGE = "Your sign-in attempt expired. Please sign in again.";

function isNextRedirect(error: unknown): boolean {
  const digest = (error as { digest?: unknown })?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"password" | "mfa">("password");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await loginAction(email, password);

      if (result?.mfaRequired) {
        setStep("mfa");
        setRecoveryMode(false);
        setRecoveryCode("");
        setRecoveryError("");
        return;
      }

      if (result?.error) {
        setErrorMsg(result.error);
      }
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await mfaLoginVerifyAction(code);

      if (result?.error) {
        if (result.error === EXPIRED_PENDING_MESSAGE) {
          setStep("password");
        }
        setErrorMsg(result.error);
      }
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");

    try {
      const result = await mfaRecoveryLoginAction(recoveryCode);

      if (result?.error) {
        if (result.error === EXPIRED_PENDING_MESSAGE) {
          setStep("password");
        }
        setRecoveryError(result.error);
      }
    } catch (error) {
      if (isNextRedirect(error)) throw error;
      setRecoveryError("Recovery failed. Please try again.");
    } finally {
      setRecoveryLoading(false);
    }
  }

  async function handleCancelMfa() {
    setErrorMsg("");
    try {
      await mfaCancelAction();
    } catch (error) {
      if (isNextRedirect(error)) throw error;
    } finally {
      setStep("password");
      setCode("");
      setPassword("");
      setEmail("");
      setRecoveryMode(false);
      setRecoveryCode("");
      setRecoveryError("");
    }
  }

  return (
    <>
      <title>Login — Maine CyberTech</title>
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full rounded-lg border border-white/5 bg-[rgba(18,30,45,0.75)] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          {step === "password" ? (
            <>
              <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
                Secure Login
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Sign in to access your Maine CyberTech client portal.
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                  >
                    Work Email
                  </label>
                  <input
                    id="email"
                    aria-label="Work Email"
                    className="w-full rounded-md border border-white/10 bg-cyber-base/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@clientdomain.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    aria-label="Password"
                    className="w-full rounded-md border border-white/10 bg-cyber-base/60 px-4 py-3 text-slate-50 outline-none transition focus:border-emerald-600"
                    type="password"
                    autoComplete="current-password"
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
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    {errorMsg}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  aria-label="Secure Login"
                >
                  {loading ? "Signing In..." : "Secure Login"}
                </Button>
              </form>

              <p className="mt-6 text-sm text-slate-400">
                Need an account?{" "}
                <Link href="/signup" className="text-emerald-400 hover:text-emerald-300">
                  Sign up
                </Link>
              </p>

              {isTestAccountsEnabled() ? (
                <p className="mt-3 text-xs text-slate-500">
                  <Link href="/test-accounts" className="text-emerald-500 hover:text-emerald-400">
                    Browse test accounts
                  </Link>{" "}
                  (dev only)
                </p>
              ) : null}
            </>
          ) : recoveryMode ? (
            <>
              <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
                Recovery Code
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Enter one of the single-use recovery codes you saved when you set up two-factor
                authentication.
              </p>

              <form onSubmit={handleRecovery} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="recovery-code"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                  >
                    Recovery Code
                  </label>
                  <input
                    id="recovery-code"
                    aria-label="Recovery Code"
                    className="w-full rounded-md border border-white/10 bg-cyber-base/60 px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-slate-50 outline-none transition focus:border-emerald-600"
                    type="text"
                    autoComplete="off"
                    inputMode="text"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={16}
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {recoveryError ? (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    {recoveryError}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={recoveryLoading}
                  loading={recoveryLoading}
                  className="w-full"
                  aria-label="Use Recovery Code"
                >
                  {recoveryLoading ? "Checking..." : "Use Recovery Code"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode(false);
                    setRecoveryCode("");
                    setRecoveryError("");
                  }}
                  className="w-full text-xs text-slate-400 transition hover:text-slate-200"
                >
                  Back to authenticator code
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
                Two-Factor Verification
              </h1>
              <p className="mt-3 text-sm text-slate-400">
                Enter the 6-digit code from your authenticator app to finish signing in.
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="totp-code"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300"
                  >
                    Verification Code
                  </label>
                  <input
                    id="totp-code"
                    aria-label="Verification Code"
                    className="w-full rounded-md border border-white/10 bg-cyber-base/60 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-slate-50 outline-none transition focus:border-emerald-600"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {errorMsg ? (
                  <div
                    role="alert"
                    className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                  >
                    {errorMsg}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="w-full"
                  aria-label="Verify and Sign In"
                >
                  {loading ? "Verifying..." : "Verify and Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode(true);
                    setCode("");
                    setErrorMsg("");
                    setRecoveryError("");
                  }}
                  className="w-full text-xs text-emerald-400 transition hover:text-emerald-300"
                >
                  Use a recovery code instead
                </button>
                <button
                  type="button"
                  onClick={handleCancelMfa}
                  className="w-full text-xs text-slate-400 transition hover:text-slate-200"
                >
                  Use a different account
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
