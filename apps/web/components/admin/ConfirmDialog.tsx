"use client";

import { useRef } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";

/**
 * Accessible confirmation dialog. Replaces native `window.confirm`, which is
 * unstyled, blocking, and inaccessible (no focus management, no screen-reader
 * semantics). Traps focus, closes on Escape, and labels the dialog.
 */
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="w-full max-w-md rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-slate-50">
          {title}
        </h2>
        {body ? <p className="mt-3 text-sm text-slate-300">{body}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="cyber-button-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={
              danger
                ? "rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                : "cyber-button"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
