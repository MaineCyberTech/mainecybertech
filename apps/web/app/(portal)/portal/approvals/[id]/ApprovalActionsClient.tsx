"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { commentApprovalAction, decideApprovalAction } from "../actions";

export default function ApprovalActionsClient({
  approvalId,
  canDecide,
  status,
}: {
  approvalId: string;
  canDecide: boolean;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      setMessage(success);
      setNotes("");
      setComment("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {status === "pending" && canDecide ? (
        <section className="cyber-panel space-y-3" aria-label="Decision">
          <h2 className="cyber-heading text-lg">Decision</h2>
          <label htmlFor="decision-notes" className="cyber-label">
            Notes / rejection reason
          </label>
          <textarea
            id="decision-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="cyber-input"
            placeholder="Optional for approval; required to reject."
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => decideApprovalAction(approvalId, "approve", notes), "Approved.")
              }
              className="cyber-button"
            >
              {pending ? "Saving…" : "Approve"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => decideApprovalAction(approvalId, "reject", notes), "Rejected.")
              }
              className="cyber-button-secondary"
            >
              Reject
            </button>
          </div>
        </section>
      ) : null}

      <section className="cyber-panel space-y-3" aria-label="Add comment">
        <h2 className="cyber-heading text-lg">Add a comment</h2>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          className="cyber-input"
          aria-label="Comment"
          placeholder="Ask a question or add context for the reviewer."
        />
        <button
          type="button"
          disabled={pending || !comment.trim()}
          onClick={() => run(() => commentApprovalAction(approvalId, comment), "Comment added.")}
          className="cyber-button-secondary"
        >
          {pending ? "Saving…" : "Post comment"}
        </button>
      </section>

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
