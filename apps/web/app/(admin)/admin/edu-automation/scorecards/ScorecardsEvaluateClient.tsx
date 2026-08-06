"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function ScorecardsEvaluateClient({ organizationId }: { organizationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [orgId, setOrgId] = useState(organizationId);

  const evaluate = () => {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const api = getClientApi();
        const res = (await api.eduAutomation.scorecards.evaluate({
          organizationId: orgId,
        })) as Record<string, unknown>;
        setResult(res);
      } catch {
        setError("Evaluation failed. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <h3 className="text-sm font-medium text-slate-50">Evaluate Scorecards</h3>
      <p className="mt-1 text-xs text-slate-400">
        Leave org blank to evaluate all organizations. Assigns badges and records score history.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          placeholder="Org UUID (blank = all orgs)"
          className="w-72 rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={evaluate}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Evaluating…" : "Assign Badges & History"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
      {result && (
        <p className="mt-3 text-xs text-slate-400">
          Evaluated: {String(result.evaluated ?? 0)} &bull; Badges:{" "}
          {Array.isArray(result.badgesAssigned)
            ? (result.badgesAssigned as string[]).join(", ")
            : "—"}{" "}
          &bull; Avg: {Math.round(Number(result.overallAvg ?? 0))}
        </p>
      )}
    </div>
  );
}
