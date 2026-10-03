"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function RiskAcceptButton({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expires, setExpires] = useState("");
  const [acceptingControls, setAcceptingControls] = useState("");
  const [done, setDone] = useState<string | null>(null);

  const accepted = status === "accepted";

  const accept = () => {
    setError(null);
    setDone(null);
    startTransition(async () => {
      try {
        await getClientApi().governance.risks.accept(id, {
          acceptanceExpires: expires ? new Date(expires).toISOString() : null,
          acceptingControls: acceptingControls.trim() || null,
        });
        setDone("Risk accepted.");
      } catch {
        setError("Failed to accept the risk.");
      }
    });
  };

  const reopen = () => {
    setError(null);
    setDone(null);
    startTransition(async () => {
      try {
        await getClientApi().governance.risks.reopen(id);
        setDone("Risk reopened.");
      } catch {
        setError("Failed to reopen the risk.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Risk Acceptance
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        Current status: <span className="text-slate-200">{status || "open"}</span>
      </p>

      {accepted ? (
        <button
          type="button"
          disabled={isPending}
          onClick={reopen}
          className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          {isPending ? "Reopening…" : "Reopen risk"}
        </button>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <label className="text-xs text-slate-400">
              Acceptance expires
              <input
                type="date"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
                className="mt-1 block rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
              />
            </label>
            <label className="flex-1 text-xs text-slate-400">
              Accepting controls
              <input
                value={acceptingControls}
                onChange={(e) => setAcceptingControls(e.target.value)}
                placeholder="Compensating controls relied upon"
                className="mt-1 block w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
              />
            </label>
            <button
              type="button"
              disabled={isPending}
              onClick={accept}
              className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {isPending ? "Accepting…" : "Accept risk"}
            </button>
          </div>
        </>
      )}

      {done && <p className="mt-2 text-xs text-emerald-400">{done}</p>}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
