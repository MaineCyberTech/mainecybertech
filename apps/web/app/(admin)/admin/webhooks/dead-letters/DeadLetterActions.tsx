"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { dismissDeadLetterAction, retryDeadLetterAction } from "./actions";

export default function DeadLetterActions({ id, event }: { id: string; event: string }) {
  const { pushToast } = useToast();
  const [retrying, setRetrying] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const busy = retrying || dismissing;

  async function retry() {
    setRetrying(true);
    try {
      const formData = new FormData();
      formData.set("id", id);
      const result = await retryDeadLetterAction(formData);
      if (result.ok) {
        pushToast("success", `"${event}" re-queued for delivery.`, "Retry scheduled");
      } else {
        pushToast("error", result.error ?? "Failed to retry delivery.", "Retry failed");
      }
    } catch {
      pushToast("error", `Failed to retry the "${event}" delivery.`, "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  async function dismiss() {
    setConfirmOpen(false);
    setDismissing(true);
    try {
      const formData = new FormData();
      formData.set("id", id);
      const result = await dismissDeadLetterAction(formData);
      if (result.ok) {
        pushToast("success", `"${event}" dismissed.`, "Dead letter removed");
      } else {
        pushToast("error", result.error ?? "Failed to dismiss delivery.", "Dismiss failed");
      }
    } catch {
      pushToast("error", `Failed to dismiss the "${event}" delivery.`, "Dismiss failed");
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-3" aria-busy={busy}>
      <button
        type="button"
        onClick={retry}
        disabled={busy}
        aria-label={`Retry ${event}`}
        className="text-xs font-semibold text-emerald-400 transition hover:text-emerald-300 disabled:opacity-50"
      >
        {retrying ? "Retrying…" : "Retry"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        aria-label={`Dismiss ${event}`}
        className="text-xs font-semibold text-red-400 transition hover:text-red-300 disabled:opacity-50"
      >
        {dismissing ? "Dismissing…" : "Dismiss"}
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={`Dismiss the "${event}" delivery?`}
        body={`The dead-letter entry for "${event}" will be permanently removed without being replayed.`}
        confirmLabel="Dismiss"
        danger
        onConfirm={dismiss}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
