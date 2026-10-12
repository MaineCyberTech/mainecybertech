"use client";

import { useId, useRef } from "react";
import { Button } from "@mct/ui/components/Button";
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
  const titleId = useId();
  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={body ? "confirm-dialog-body" : undefined}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        className="max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-md overflow-y-auto rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
      >
        <h2 id={titleId} className="text-lg font-bold text-slate-50">
          {title}
        </h2>
        {body ? (
          <p id="confirm-dialog-body" className="mt-3 text-sm text-slate-300">
            {body}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            autoFocus
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
