"use client";

import { useState } from "react";
import { approveMembership, rejectMembership } from "./actions";

/**
 * Approve/reject buttons for a pending membership. Calls the server action
 * directly so a failed approval (e.g. a rejected PATCH) shows the API error
 * inline instead of throwing into the route error boundary (USE-P1-003).
 */
export default function MembershipApprovalActions({ membershipId }: { membershipId: string }) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject") {
    setError(null);
    setBusy(action);
    try {
      const formData = new FormData();
      formData.set("membershipId", membershipId);
      const result =
        action === "approve"
          ? await approveMembership(formData)
          : await rejectMembership(formData);
      if (!result.ok) {
        setError(result.error ?? "The membership could not be updated.");
      }
    } catch {
      setError("The membership could not be updated. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run("approve")}
          disabled={busy !== null}
          aria-busy={busy === "approve"}
          className="cyber-button disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "approve" ? "Approving…" : "Approve User"}
        </button>
        <button
          type="button"
          onClick={() => run("reject")}
          disabled={busy !== null}
          aria-busy={busy === "reject"}
          className="cyber-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reject" ? "Rejecting…" : "Reject User"}
        </button>
      </div>
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
