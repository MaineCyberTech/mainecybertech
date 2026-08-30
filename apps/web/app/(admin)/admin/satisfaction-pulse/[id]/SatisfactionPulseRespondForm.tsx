"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function SatisfactionPulseRespondForm({
  id,
  organizationId,
  status,
  rating,
}: {
  id: string;
  organizationId: string;
  status: string;
  rating: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState(rating);
  const [feedback, setFeedback] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await api.satisfactionPulse.respond(id, {
          organizationId,
          rating: currentRating,
          feedback: feedback.trim() || null,
        });
        setCurrentStatus("responded");
      } catch {
        setError("Failed to record response.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Record Response
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="text-xs text-slate-400">
          Rating (0-10)
          <input
            type="number"
            min={0}
            max={10}
            value={currentRating}
            onChange={(e) => setCurrentRating(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
        <label className="flex-1 text-xs text-slate-400">
          Feedback
          <input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Client feedback"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending || currentStatus === "responded"}
          onClick={submit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Record Response"}
        </button>
        {currentStatus === "responded" && (
          <span className="text-sm text-emerald-400">Responded</span>
        )}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
