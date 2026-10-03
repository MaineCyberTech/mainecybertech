"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function RiskAssessButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [done, setDone] = useState(false);

  const assess = () => {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await api.governance.risks.assess(id, { likelihood, impact });
        setDone(true);
      } catch {
        setError("Assessment failed. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Assess Risk
      </h3>
      <div className="mt-3 flex flex-wrap items-end gap-4">
        <label className="text-xs text-slate-400">
          Likelihood (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={likelihood}
            onChange={(e) => setLikelihood(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="text-xs text-slate-400">
          Impact (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={impact}
            onChange={(e) => setImpact(Number(e.target.value))}
            className="mt-1 w-20 rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={assess}
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {isPending ? "Assessing…" : "Assess & Score"}
        </button>
      </div>
      {done && <p className="mt-2 text-xs text-emerald-400">Risk assessed. Score updated.</p>}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
