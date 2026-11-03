"use client";

import { useState, useTransition } from "react";
import { reviewAiDraftAction } from "./actions";

type Props = {
  draftId: string;
  organizationId: string;
};

/** FEAT-P3-009: client wrapper so the review action can report failures. */
export default function DraftReviewForm({ draftId, organizationId }: Props) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function review(decision: "approved" | "rejected") {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await reviewAiDraftAction(draftId, organizationId, decision, notes);
      if (!result.ok) {
        setError(result.error ?? "Failed to review the draft");
        return;
      }
      setMessage(decision === "approved" ? "Draft approved." : "Draft rejected.");
      setNotes("");
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <label
        htmlFor={`review-notes-${draftId}`}
        className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"
      >
        Reviewer notes (optional)
      </label>
      <textarea
        id={`review-notes-${draftId}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={2}
        className="cyber-input"
        placeholder="Why is this output approved or rejected?"
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => review("approved")}
          className="cyber-button"
        >
          {pending ? "Saving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => review("rejected")}
          className="cyber-button-secondary"
        >
          Reject
        </button>
      </div>
      {message ? (
        <p role="status" className="text-sm text-emerald-400">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
