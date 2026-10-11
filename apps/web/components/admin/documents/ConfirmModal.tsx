import { useRef } from "react";
import { useFocusTrap } from "@/lib/use-focus-trap";

export default function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        ref={dialogRef}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,24,0.97),rgba(10,17,24,0.96))] p-6 shadow-[0_30px_100px_rgba(2,6,23,0.45)]"
      >
        <h3
          id="confirm-modal-title"
          className="font-display text-lg uppercase tracking-[0.12em] text-slate-50"
        >
          {title}
        </h3>
        <p className="mt-3 text-sm text-slate-300">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="cyber-button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={
              danger
                ? "rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/20"
                : "cyber-button"
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
