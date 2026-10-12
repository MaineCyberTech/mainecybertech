"use client";

import { useState, useTransition } from "react";
import { toggleChecklistItemAction } from "./actions";

type Props = {
  recordId: string;
  itemId: string;
  label: string;
  isRequired: boolean;
  notes: string | null;
  completedAt: string | null;
  initialCompleted: boolean;
};

function relativeTime(value: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(value).toLocaleDateString();
}

/**
 * USE-P2-008: interactive checklist row. The API/SDK PATCH was already in
 * place; this wires the checkbox to it and reverts optimistic state when the
 * write fails so progress can actually be completed from the web app.
 */
export default function ChecklistItemToggle({
  recordId,
  itemId,
  label,
  isRequired,
  notes,
  completedAt,
  initialCompleted,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [completedTime, setCompletedTime] = useState(completedAt);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    if (pending) return;
    setError("");
    setCompleted(next);
    startTransition(async () => {
      const result = await toggleChecklistItemAction(recordId, itemId, next);
      if (!result.ok) {
        setCompleted(!next);
        setError(result.error);
        return;
      }
      setCompletedTime(next ? new Date().toISOString() : null);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-cyber-base/60 p-3">
      <input
        type="checkbox"
        checked={completed}
        disabled={pending}
        onChange={(event) => handleChange(event.target.checked)}
        aria-label={label}
        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-medium ${completed ? "text-slate-400 line-through" : "text-slate-50"}`}
        >
          {label}
          {isRequired && <span className="ml-2 text-[11px] text-red-400">(required)</span>}
        </p>
        {notes && <p className="mt-1 text-xs text-slate-400">{notes}</p>}
        {completedTime && (
          <p className="mt-1 text-xs text-slate-500">Completed {relativeTime(completedTime)}</p>
        )}
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
