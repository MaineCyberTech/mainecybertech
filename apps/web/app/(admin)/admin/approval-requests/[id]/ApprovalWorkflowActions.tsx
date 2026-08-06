"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function ApprovalWorkflowActions({
  id,
  organizationId,
  status,
}: {
  id: string;
  organizationId: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reason, setReason] = useState("");

  const run = (action: "approve" | "reject" | "cancel") => {
    if (action === "reject" && !reason.trim()) {
      setError("A rejection reason is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const api = getClientApi();
        if (action === "approve") {
          await api.approvals.approve(id, { organizationId });
          setCurrentStatus("approved");
        } else if (action === "reject") {
          await api.approvals.reject(id, { organizationId, reason: reason.trim() });
          setCurrentStatus("rejected");
        } else {
          await api.approvals.cancel(id, { organizationId, reason: reason.trim() || null });
          setCurrentStatus("cancelled");
        }
      } catch {
        setError(`${action[0].toUpperCase()}${action.slice(1)} failed. Please try again.`);
      }
    });
  };

  if (currentStatus !== "pending") {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
        <span className="text-sm text-slate-400">
          Status: <span className="font-medium text-slate-50">{currentStatus}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Decision</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("approve")}
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {isPending ? "Working…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("reject")}
          className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          {isPending ? "Working…" : "Reject"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run("cancel")}
          className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          {isPending ? "Working…" : "Cancel"}
        </button>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        Reason / notes
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </label>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
