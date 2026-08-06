"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

type Action = {
  label: string;
  endpoint: (
    id: string,
    api: ReturnType<typeof getClientApi>,
    context: Record<string, unknown>,
  ) => Promise<unknown>;
  confirm?: string;
};

export default function WorkflowActionButtons({
  id,
  actions,
  context = {},
  onDone,
}: {
  id: string;
  actions: Action[];
  context?: Record<string, unknown>;
  onDone?: () => void;
}) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: Action) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setError(null);
    setPendingAction(action.label);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await action.endpoint(id, api, context);
        setPendingAction(null);
        onDone?.();
      } catch {
        setPendingAction(null);
        setError("Action failed. Please try again.");
      }
    });
  };

  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Workflow</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={isPending && pendingAction === action.label}
            onClick={() => run(action)}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isPending && pendingAction === action.label ? "Working…" : action.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
