"use client";

import { useState, useCallback } from "react";
import { deletePromotionAction } from "./actions";

export default function DeleteButton({ id, name: _name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleDelete = useCallback(async () => {
    setPending(true);
    setError("");
    const form = new FormData();
    form.set("id", id);
    const result = await deletePromotionAction({ ok: true }, form);
    if (!result.ok) {
      setError(result.error ?? "Failed to delete");
      setPending(false);
    }
  }, [id]);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-amber-400">Confirm?</span>
        <button
          onClick={handleDelete}
          disabled={pending}
          className="text-xs font-semibold text-red-400 transition hover:text-red-300"
        >
          {pending ? "..." : "Delete"}
        </button>
        <button
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

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-slate-500 transition hover:text-red-400"
    >
      Delete
    </button>
  );
}
