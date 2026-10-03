"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

export default function AiPolicyGenerateButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const generate = () => {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        await getClientApi().eduAutomation.aiPolicy.generate(id);
        setDone(true);
        router.refresh();
      } catch {
        setError("Failed to generate the policy draft.");
      }
    });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
        Policy draft
      </h3>
      <p className="mt-1 text-xs text-slate-400">
        Compose a policy document from the approved tools, data-handling rules and employee
        guidance.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={generate}
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {isPending ? "Generating…" : "Generate draft"}
        </button>
        {done && <span className="text-xs text-emerald-400">Draft generated.</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}
