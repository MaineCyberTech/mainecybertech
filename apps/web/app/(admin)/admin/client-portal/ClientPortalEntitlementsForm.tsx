"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { getClientApi } from "@/lib/client-api";

const PORTAL_MODULES = [
  "dashboard",
  "support",
  "documents",
  "projects",
  "billing",
  "status",
  "notifications",
  "profile",
  "findings",
  "security-ops",
  "governance",
  "training-hub",
  "service-catalog",
  "qbr",
];

export default function ClientPortalEntitlementsForm({
  organizationId,
}: {
  organizationId: string;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await getClientApi().clientPortal.getEntitlements(organizationId);
      const map: Record<string, boolean> = {};
      for (const item of r.items ?? []) map[item.module_key] = item.enabled;
      setEnabled(map);
    } catch {
      setError("Failed to load entitlements.");
    }
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = () => {
    setError(null);
    setDone(false);
    startTransition(async () => {
      try {
        await getClientApi().clientPortal.setEntitlements(
          organizationId,
          PORTAL_MODULES.map((moduleKey) => ({ moduleKey, enabled: enabled[moduleKey] ?? false })),
        );
        setDone(true);
      } catch {
        setError("Failed to save entitlements.");
      }
    });
  };

  return (
    <section className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Portal modules
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Tick the modules this organisation may use. Saving overrides the subscription-derived
        default set.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PORTAL_MODULES.map((m) => (
          <label key={m} className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={enabled[m] ?? false}
              onChange={(e) => setEnabled((prev) => ({ ...prev, [m]: e.target.checked }))}
              className="h-4 w-4 rounded border-white/20 bg-transparent"
            />
            {m}
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={save}
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save modules"}
        </button>
        {done && <span className="text-xs text-emerald-400">Entitlements saved.</span>}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </section>
  );
}
