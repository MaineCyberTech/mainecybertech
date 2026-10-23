"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideProposalAction } from "./actions";

export default function ProposalDecisionClient({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const decide = (decision: "accepted" | "declined") => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await decideProposalAction(proposalId, decision, notes);
      if (!result.ok) {
        setError(result.error ?? "Could not record your decision.");
        return;
      }
      setMessage(decision === "accepted" ? "Proposal accepted." : "Proposal declined.");
      setNotes("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <p className="text-sm font-medium text-slate-200">Your decision</p>
      <label htmlFor="proposal-decision-notes" className="cyber-label">
        Notes (optional)
      </label>
      <textarea
        id="proposal-decision-notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={3}
        className="cyber-input"
        placeholder="Add any conditions or questions for your account team."
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("accepted")}
          className="cyber-button"
        >
          {pending ? "Saving…" : "Accept proposal"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("declined")}
          className="cyber-button-secondary"
        >
          Decline
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
