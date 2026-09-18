"use client";

import { useState } from "react";
import {
  enrollMfaAction,
  listMfaFactorsAction,
  removeMfaAction,
  verifyMfaAction,
  type MfaFactorView,
} from "./actions";

type Pending = { factorId: string; qrCode: string; secret: string };

export default function MfaSettingsClient({ initialFactors }: { initialFactors: MfaFactorView[] }) {
  const [factors, setFactors] = useState<MfaFactorView[]>(initialFactors);
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    const result = await listMfaFactorsAction();
    if (result.ok && result.data) setFactors(result.data);
  }

  async function startEnroll() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await enrollMfaAction("Authenticator app");
    setBusy(false);
    if (!result.ok || !result.data) {
      setError(result.ok ? "Enrollment failed" : result.error);
      return;
    }
    setPending(result.data);
    setCode("");
  }

  async function confirmEnroll() {
    if (!pending) return;
    setBusy(true);
    setError("");
    const result = await verifyMfaAction(pending.factorId, code);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPending(null);
    setCode("");
    setMessage("Two-factor authentication enabled.");
    await refresh();
  }

  async function remove(factorId: string) {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await removeMfaAction(factorId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Authenticator removed.");
    await refresh();
  }

  const verified = factors.filter((f) => f.status === "verified");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-orbitron text-2xl uppercase tracking-[0.14em] text-slate-50">
          Security
        </h1>
        <p className="mt-3 text-slate-400">
          Add a time-based one-time passcode (TOTP) authenticator app as a second factor. Enrollment
          is optional and can be removed at any time.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg border border-emerald-600/20 bg-cyber-card-deep/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Authenticator app</h2>

        {pending ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-400">
              Scan this QR code with your authenticator app, or enter the secret manually, then type
              the 6-digit code to confirm.
            </p>
            <div
              className="w-48 rounded bg-white p-3 [&_svg]:h-full [&_svg]:w-full"
              // Supabase GoTrue returns a trusted SVG data URI for the otpauth
              // enrollment; it is not user-supplied.
              dangerouslySetInnerHTML={{ __html: pending.qrCode }}
            />
            <p className="break-all text-xs text-slate-400">
              Secret: <span className="font-mono text-slate-200">{pending.secret}</span>
            </p>
            <div className="flex items-end gap-3">
              <div>
                <label htmlFor="mfa-code" className="cyber-label">
                  Verification code
                </label>
                <input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="cyber-input w-40"
                />
              </div>
              <button
                type="button"
                onClick={confirmEnroll}
                disabled={busy || code.trim().length < 6}
                className="cyber-button"
              >
                {busy ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                disabled={busy}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {verified.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {verified.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded border border-slate-700/50 p-3"
                  >
                    <span className="text-sm text-slate-200">
                      {f.friendlyName ?? "Authenticator app"}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(f.id)}
                      disabled={busy}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No authenticator app is enrolled yet.</p>
            )}
            <button
              type="button"
              onClick={startEnroll}
              disabled={busy}
              className="cyber-button mt-4"
            >
              {busy ? "Starting..." : "Add authenticator app"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
