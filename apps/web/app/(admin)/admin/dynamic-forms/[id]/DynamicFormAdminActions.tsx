"use client";

import { useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

export default function DynamicFormAdminActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);

  const publish = () => {
    setError(null);
    startTransition(async () => {
      try {
        const api = getClientApi();
        await api.dynamicForms.publish(id, {});
        setCurrentStatus("published");
      } catch {
        setError("Publish failed. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Admin Actions
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {currentStatus === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={publish}
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isPending ? "Publishing…" : "Publish Form"}
          </button>
        )}
        {currentStatus === "published" && (
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            Published
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
