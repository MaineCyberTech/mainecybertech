"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function PortalFeedbackForm({ organizationId }: { organizationId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(8);
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");

  const submit = () => {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await api.satisfactionPulse.create({
          organizationId,
          subject: subject.trim() || "Portal feedback",
          question: "How satisfied are you with our service?",
          rating,
          feedback: feedback.trim() || null,
          source: "portal",
        });
        setDone(true);
        setSubject("");
        setFeedback("");
      } catch {
        setError("Failed to submit feedback. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Share your feedback
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        Tell us how we are doing. Your response goes straight to your account team.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block text-xs text-slate-400">
          Rating (0-10)
          <input
            type="number"
            min={0}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 w-24 rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>

        <label className="block text-xs text-slate-400">
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Optional summary"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>

        <label className="block text-xs text-slate-400">
          Feedback
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            placeholder="What is working well? What could be better?"
            className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit feedback"}
        </button>
        {done && <span className="text-sm text-emerald-400">Thank you - feedback submitted.</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
