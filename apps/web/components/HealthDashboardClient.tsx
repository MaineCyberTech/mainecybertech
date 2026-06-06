"use client";

import { useState, useEffect, useCallback } from "react";

type ServiceStatus = "ok" | "degraded" | "down" | "checking";

type HealthState = {
  api: ServiceStatus;
  db: ServiceStatus;
  worker: ServiceStatus;
  apiLatency?: number;
  dbLatency?: number;
};

const API_URL = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
  : "http://localhost:4000";

export default function HealthDashboardClient() {
  const [health, setHealth] = useState<HealthState>({ api: "checking", db: "checking", worker: "checking" });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
      const json = await res.json();
      const latency = Date.now() - start;
      setHealth({
        api: res.ok ? "ok" : "down",
        db: json.database === "healthy" ? "ok" : json.database ? "degraded" : "down",
        worker: json.worker === "healthy" ? "ok" : json.worker ? "degraded" : "down",
        apiLatency: latency,
        dbLatency: json.databaseLatency ?? undefined,
      });
    } catch {
      setHealth({ api: "down", db: "down", worker: "down", apiLatency: Date.now() - start });
    }
    setLastChecked(new Date());
  }, []);

  useEffect(() => { check(); const interval = setInterval(check, 30000); return () => clearInterval(interval); }, [check]);

  function statusIcon(status: ServiceStatus) {
    const colors = { ok: "bg-emerald-500", degraded: "bg-amber-500", down: "bg-red-500", checking: "bg-slate-500" };
    return <span className={`inline-block h-3 w-3 rounded-full ${colors[status]} ${status === "checking" ? "animate-pulse" : ""}`} />;
  }

  function statusLabel(status: ServiceStatus) {
    return status === "ok" ? "Operational" : status === "degraded" ? "Degraded" : status === "down" ? "Down" : "Checking...";
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`rounded-lg border p-5 ${
          health.api === "ok" ? "border-emerald-500/20 bg-emerald-500/5"
          : health.api === "down" ? "border-red-500/20 bg-red-500/5"
          : "border-white/10 bg-[#0A1118]/60"
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-200">API Server</p>
            {statusIcon(health.api)}
          </div>
          <p className="mt-2 text-sm text-slate-400">{statusLabel(health.api)}</p>
          {health.apiLatency ? <p className="mt-1 text-xs text-slate-500">{health.apiLatency}ms response</p> : null}
        </div>

        <div className={`rounded-lg border p-5 ${
          health.db === "ok" ? "border-emerald-500/20 bg-emerald-500/5"
          : health.db === "down" ? "border-red-500/20 bg-red-500/5"
          : "border-white/10 bg-[#0A1118]/60"
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-200">Database</p>
            {statusIcon(health.db)}
          </div>
          <p className="mt-2 text-sm text-slate-400">{statusLabel(health.db)}</p>
          {health.dbLatency ? <p className="mt-1 text-xs text-slate-500">{health.dbLatency}ms</p> : null}
        </div>

        <div className={`rounded-lg border p-5 ${
          health.worker === "ok" ? "border-emerald-500/20 bg-emerald-500/5"
          : health.worker === "down" ? "border-red-500/20 bg-red-500/5"
          : "border-white/10 bg-[#0A1118]/60"
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-200">Worker</p>
            {statusIcon(health.worker)}
          </div>
          <p className="mt-2 text-sm text-slate-400">{statusLabel(health.worker)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Last checked: {lastChecked?.toLocaleTimeString() ?? "—"}</span>
        <button onClick={check} className="cyber-button-secondary text-xs">Refresh</button>
      </div>
    </div>
  );
}
