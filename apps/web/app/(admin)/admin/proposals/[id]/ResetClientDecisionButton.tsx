"use client";

import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { resetClientDecisionAction } from "../actions";

/** USE-P2-013: staff-only, audited reset of an accidental client decision. */
export default function ResetClientDecisionButton({ proposalId }: { proposalId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await resetClientDecisionAction(proposalId);
      if (!result.ok) setError(result.error ?? "Failed to reset the client decision");
    });
  }

  return (
    <>
      <button
        type="button"
        className="cyber-button-secondary"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {pending ? "Resetting…" : "Reset client decision"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        open={open}
        title="Clear the client's accept/decline decision?"
        body="The decision and its notes are removed and a timeline entry is recorded. The client can then decide again."
        confirmLabel="Reset decision"
        danger
        onConfirm={reset}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
