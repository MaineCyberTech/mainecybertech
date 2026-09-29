"use client";

import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDateShort } from "@/lib/format";
import {
  enrollMfaAction,
  generateRecoveryCodesAction,
  listMfaFactorsAction,
  removeMfaAction,
  revokeRecoveryCodesAction,
  stepUpMfaAction,
  verifyMfaAction,
  type MfaFactorView,
  type MfaRecoveryStatusView,
} from "./actions";

type Pending = { factorId: string; qrCode: string; secret: string };

export default function MfaSettingsClient({
  initialFactors,
  initialRecovery = null,
  recovered = false,
}: {
  initialFactors: MfaFactorView[];
  initialRecovery?: MfaRecoveryStatusView | null;
  recovered?: boolean;
}) {
  const { pushToast } = useToast();
  const [factors, setFactors] = useState<MfaFactorView[]>(initialFactors);
  const [pending, setPending] = useState<Pending | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [recovery, setRecovery] = useState<MfaRecoveryStatusView | null>(initialRecovery);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [recoveryError, setRecoveryError] = useState("");
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [stepUpFor, setStepUpFor] = useState<"generate" | "revoke" | null>(null);
  const [stepUpCode, setStepUpCode] = useState("");
  const [stepUpError, setStepUpError] = useState("");
  const [stepUpBusy, setStepUpBusy] = useState(false);
  const stepUpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stepUpFor) stepUpInputRef.current?.focus();
  }, [stepUpFor]);

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

  async function generateRecoveryCodes() {
    setBusy(true);
    setRecoveryError("");
    const result = await generateRecoveryCodesAction();
    setBusy(false);
    if (!result.ok) {
      if (result.code === "MFA_REQUIRED") {
        openStepUp("generate");
        return;
      }
      setRecoveryError(result.error);
      return;
    }
    const data = result.data;
    if (!data || data.codes.length === 0) {
      setRecoveryError("Recovery code generation failed.");
      return;
    }
    setRecoveryCodes(data.codes);
    setRecovery((current) => ({
      remaining: data.remaining,
      total: current?.total ?? data.codes.length,
      lastGeneratedAt: new Date().toISOString(),
    }));
    pushToast("success", "New recovery codes generated.", "Recovery codes");
  }

  async function revokeRecoveryCodes() {
    setRevokeOpen(false);
    setBusy(true);
    setRecoveryError("");
    const result = await revokeRecoveryCodesAction();
    setBusy(false);
    if (!result.ok) {
      if (result.code === "MFA_REQUIRED") {
        openStepUp("revoke");
        return;
      }
      setRecoveryError(result.error);
      return;
    }
    setRecoveryCodes(null);
    setRecovery((current) => (current ? { ...current, remaining: 0 } : current));
    pushToast("success", "All recovery codes were revoked.", "Recovery codes revoked");
  }

  function openStepUp(action: "generate" | "revoke") {
    setStepUpFor(action);
    setStepUpCode("");
    setStepUpError("");
  }

  function cancelStepUp() {
    setStepUpFor(null);
    setStepUpCode("");
    setStepUpError("");
  }

  async function confirmStepUp() {
    const factor = factors.find((f) => f.status === "verified");
    if (!factor) {
      setStepUpError("No verified authenticator app was found. Add an authenticator app first.");
      return;
    }
    setStepUpBusy(true);
    setStepUpError("");
    const result = await stepUpMfaAction(factor.id, stepUpCode.trim());
    setStepUpBusy(false);
    if (!result.ok) {
      setStepUpError(result.error);
      return;
    }
    const retry = stepUpFor;
    cancelStepUp();
    if (retry === "generate") {
      await generateRecoveryCodes();
    } else if (retry === "revoke") {
      await revokeRecoveryCodes();
    }
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      pushToast("success", "Recovery codes copied to your clipboard.", "Copied");
    } catch {
      pushToast("error", "Clipboard access was blocked by the browser.", "Copy failed");
    }
  }

  const verified = factors.filter((f) => f.status === "verified");
  const hasRecoveryCodes = recovery !== null && recovery.remaining > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl uppercase tracking-[0.14em] text-slate-50">
          Security
        </h1>
        <p className="mt-3 text-slate-400">
          Add a time-based one-time passcode (TOTP) authenticator app as a second factor. Enrollment
          is optional and can be removed at any time.
        </p>
      </div>

      {message ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {message}
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      ) : null}

      <section
        id="authenticator-app"
        className="rounded-lg border border-emerald-600/20 bg-cyber-card-deep/60 p-6"
      >
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

      <section className="rounded-lg border border-emerald-600/20 bg-cyber-card-deep/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Recovery codes</h2>
        <p className="mt-2 text-sm text-slate-400">
          Single-use codes you can spend once to reset your authenticator if you lose your device.
        </p>

        {recovered ? (
          <div
            role="status"
            className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
          >
            Your authenticator was reset with a recovery code. Enroll a new authenticator to restore
            two-factor protection.{" "}
            <a
              href="#authenticator-app"
              className="font-semibold text-amber-100 underline hover:text-amber-50"
            >
              Enroll a new authenticator
            </a>
          </div>
        ) : null}

        {recovery ? (
          <p className="mt-4 text-sm text-slate-300">
            {recovery.remaining} of {recovery.total} recovery codes remaining
            {recovery.lastGeneratedAt ? (
              <span className="text-slate-400">
                {" "}
                — last generated {formatDateShort(recovery.lastGeneratedAt)}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Recovery code status is unavailable right now.
          </p>
        )}

        {recoveryError ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {recoveryError}
          </div>
        ) : null}

        {recoveryCodes ? (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4"
          >
            <p className="text-sm text-emerald-200">
              Save these codes somewhere safe. They are shown only once, and each can be used a
              single time.
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-slate-100">
              {recoveryCodes.map((recoveryCode) => (
                <li key={recoveryCode}>{recoveryCode}</li>
              ))}
            </ul>
            <button type="button" onClick={copyRecoveryCodes} className="cyber-button mt-4">
              Copy codes
            </button>
          </div>
        ) : null}

        {stepUpFor ? (
          <div className="mt-4 space-y-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-sm text-slate-300">Confirm your authenticator code to continue.</p>
            <div className="flex items-end gap-3">
              <div>
                <label htmlFor="recovery-step-up-code" className="cyber-label">
                  Authenticator code
                </label>
                <input
                  id="recovery-step-up-code"
                  ref={stepUpInputRef}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={stepUpCode}
                  onChange={(e) => setStepUpCode(e.target.value)}
                  className="cyber-input w-40"
                />
              </div>
              <button
                type="button"
                onClick={confirmStepUp}
                disabled={stepUpBusy || stepUpCode.trim().length < 6}
                className="cyber-button"
              >
                {stepUpBusy ? "Confirming..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={cancelStepUp}
                disabled={stepUpBusy}
                className="text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>
            {stepUpError ? (
              <p role="alert" className="text-sm text-red-300">
                {stepUpError}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={generateRecoveryCodes}
            disabled={busy || stepUpBusy}
            className="cyber-button"
          >
            {busy ? "Working..." : recoveryCodes ? "Regenerate codes" : "Generate codes"}
          </button>
          {hasRecoveryCodes ? (
            <button
              type="button"
              onClick={() => setRevokeOpen(true)}
              disabled={busy || stepUpBusy}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Revoke codes
            </button>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={revokeOpen}
        title="Revoke all recovery codes?"
        body="Every existing code will stop working immediately. This cannot be undone."
        confirmLabel="Revoke"
        danger
        onConfirm={revokeRecoveryCodes}
        onClose={() => setRevokeOpen(false)}
      />
    </div>
  );
}
