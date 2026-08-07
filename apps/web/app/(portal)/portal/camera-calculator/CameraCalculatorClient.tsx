"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";
import StatusPill from "@/components/StatusPill";

interface Props {
  organizationId: string;
  initialItems: Array<Record<string, unknown>>;
}

function formatTb(v: unknown): string {
  const n = Number(v);
  if (Number.isNaN(n)) return "N/A";
  return `${n.toFixed(2)} TB`;
}

export default function CameraCalculatorClient({ organizationId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [cameraCount, setCameraCount] = useState(8);
  const [bitrateMbps, setBitrateMbps] = useState(4);
  const [retentionDays, setRetentionDays] = useState(30);
  const [resolution, setResolution] = useState("4MP");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function calculate() {
    setError(null);
    setResult(null);
    setSavedMessage(null);
    try {
      const client = getClientApi();
      const res = await client.fieldServices.camera.calculate({
        organizationId,
        cameraCount,
        bitrateMbps,
        resolution,
        retentionDays,
      });
      setResult(res);
    } catch {
      setError("Calculation failed. Please try again.");
    }
  }

  async function saveCalculation() {
    if (!result) return;
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const client = getClientApi();
      const saved = await client.fieldServices.camera.create({
        organizationId,
        siteName: `${result.cameraCount} cams @ ${result.resolution}`,
        cameraCount: Number(result.cameraCount),
        avgBitrateMbps: Number(result.bitrateMbps),
        resolution: String(result.resolution),
        retentionDays: Number(result.retentionDays),
        estimatedStorageTb: Number(result.totalStorageTB),
        recommendedNvr: String(result.recommendedNVR),
        status: "draft",
      });
      setItems((prev) => [saved as unknown as Record<string, unknown>, ...prev]);
      setSavedMessage("Calculation saved.");
    } catch {
      setError("Could not save the calculation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-4">
        <h2 className="text-sm font-medium text-slate-50">New calculation</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-400">
            Camera count
            <input
              type="number"
              min={1}
              value={cameraCount}
              onChange={(e) => setCameraCount(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label className="text-xs text-slate-400">
            Bitrate (Mbps)
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={bitrateMbps}
              onChange={(e) => setBitrateMbps(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label className="text-xs text-slate-400">
            Retention (days)
            <input
              type="number"
              min={1}
              max={365}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            />
          </label>
          <label className="text-xs text-slate-400">
            Resolution
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50"
            >
              {["2MP", "4MP", "8MP", "12MP"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={calculate}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Calculate
          </button>
          {result && (
            <button
              type="button"
              onClick={saveCalculation}
              disabled={saving}
              className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save calculation"}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {savedMessage && <p className="mt-3 text-sm text-emerald-400">{savedMessage}</p>}
        {result && (
          <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-white/5 p-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-400">Daily storage</p>
              <p className="text-lg font-medium text-slate-50">
                {Number(result.dailyStorageGB).toFixed(2)} GB
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total storage</p>
              <p className="text-lg font-medium text-slate-50">{formatTb(result.totalStorageTB)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Recommended NVR</p>
              <p className="text-lg font-medium text-slate-50">{String(result.recommendedNVR)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Cameras &times; retention</p>
              <p className="text-lg font-medium text-slate-50">
                {String(result.cameraCount)} &times; {String(result.retentionDays)}d
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-50">Saved calculations</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {items.map((a) => (
            <div
              key={String(a.id)}
              className="rounded-lg border border-white/10 bg-cyber-base/60 p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-50">{String(a.site_name || "Site")}</p>
                <StatusPill status={String(a.status || "unknown")} />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Cameras: {String(a.camera_count ?? "N/A")} &bull; Storage:{" "}
                {formatTb(a.estimated_storage_tb)} &bull; Retention:{" "}
                {String(a.retention_days ?? "N/A")} days &bull; NVR:{" "}
                {String(a.recommended_nvr ?? "N/A")}
              </p>
              {(a.created_at as string | null) && (
                <p className="mt-1 text-xs text-slate-400">
                  Created: {new Date(String(a.created_at)).toISOString().slice(0, 10)}
                </p>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400">No camera calculations available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
