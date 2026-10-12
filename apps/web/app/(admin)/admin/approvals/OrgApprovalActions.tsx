"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { approveOrganization, rejectOrganization } from "./actions";

/**
 * USE-P2-010: approving is additive, but rejecting an organization removes
 * access, so it goes through the accessible ConfirmDialog instead of firing on
 * a single click. Both paths return a result and render success/failure inline.
 */
export default function OrgApprovalActions({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function run(action: "approve" | "reject") {
    setError(null);
    setMessage(null);
    setBusy(action);
    try {
      const formData = new FormData();
      formData.set("organizationId", organizationId);
      const result =
        action === "approve"
          ? await approveOrganization(formData)
          : await rejectOrganization(formData);
      if (!result.ok) {
        setError(result.error ?? "The organization could not be updated.");
      } else {
        setMessage(
          action === "approve"
            ? `Approved ${organizationName}.`
            : `Rejected ${organizationName}.`,
        );
      }
    } catch {
      setError("The organization could not be updated. Please try again.");
    } finally {
      setBusy(null);
      setConfirmOpen(false);
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
          {busy === "approve" ? "Approving…" : "Approve Org"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={busy !== null}
          className="cyber-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "reject" ? "Rejecting…" : "Reject Org"}
        </button>
      </div>
      {message && (
        <p role="status" className="max-w-xs text-right text-xs text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="max-w-xs text-right text-xs text-red-400">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={`Reject ${organizationName}?`}
        body="Rejecting removes this organization from the approval queue and denies access. This can be changed later by an administrator."
        confirmLabel="Reject"
        danger
        onConfirm={() => run("reject")}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
