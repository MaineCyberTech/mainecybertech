"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatCurrency } from "@/lib/format";
import { decideProposalAction } from "./actions";

type Props = {
  proposalId: string;
  proposalTitle?: string | null;
  proposalTotal?: number | null;
};

export default function ProposalDecisionClient({
  proposalId,
  proposalTitle,
  proposalTotal,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // USE-P2-013: accepting/declining commits the organization commercially, so
  // the click opens a confirmation naming the proposal and its total.
  const [pendingDecision, setPendingDecision] = useState<"accepted" | "declined" | null>(null);

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

  const totalLabel =
    typeof proposalTotal === "number" ? ` for ${formatCurrency(proposalTotal)}` : "";

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
          onClick={() => setPendingDecision("accepted")}
          className="cyber-button"
        >
          {pending ? "Saving…" : "Accept proposal"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setPendingDecision("declined")}
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
      <ConfirmDialog
        open={pendingDecision !== null}
        title={pendingDecision === "accepted" ? "Accept this proposal?" : "Decline this proposal?"}
        body={`${proposalTitle ?? "This proposal"}${totalLabel}. ${
          pendingDecision === "accepted"
            ? "Accepting records your organization's decision; this cannot be undone from the portal."
            : "Declining records your organization's decision; this cannot be undone from the portal."
        }`}
        confirmLabel={pendingDecision === "accepted" ? "Accept proposal" : "Decline proposal"}
        danger={pendingDecision === "declined"}
        onClose={() => setPendingDecision(null)}
        onConfirm={() => {
          const decision = pendingDecision;
          setPendingDecision(null);
          if (decision) decide(decision);
        }}
      />
    </div>
  );
}
