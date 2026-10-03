"use client";

import { useState } from "react";
import { deleteCampaignAction, updateCampaignStatusAction } from "./actions";
import type { StoreCampaignStatus } from "@mct/sdk";

const STATUSES: StoreCampaignStatus[] = ["draft", "active", "paused", "archived"];

export function CampaignStatusForm({ id, status }: { id: string; status: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [value, setValue] = useState(status);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", value);
    const result = await updateCampaignStatusAction(formData);
    if (!result.ok) setError(result.error ?? "Failed to update the campaign.");
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        aria-label="Campaign status"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-white/10 bg-cyber-base/60 px-2 py-1 text-xs text-slate-200"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-amber-400">
          {error}
        </span>
      )}
    </form>
  );
}

export function DeleteCampaignButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteCampaignAction(formData);
    if (!result.ok) {
      setError(result.error ?? "Failed to delete");
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-red-400 transition hover:text-red-300"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-amber-400">Confirm?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-xs font-semibold text-red-400 transition hover:text-red-300"
      >
        {pending ? "..." : "Delete"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError("");
        }}
        className="text-xs text-slate-500 transition hover:text-slate-300"
      >
        Cancel
      </button>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
