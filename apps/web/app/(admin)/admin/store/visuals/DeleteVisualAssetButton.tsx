"use client";

import { useState } from "react";
import { deleteVisualAssetAction } from "./actions";

export default function DeleteVisualAssetButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteVisualAssetAction(formData);
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
      <span className="text-[10px] text-amber-400">Confirm?</span>
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
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
}
