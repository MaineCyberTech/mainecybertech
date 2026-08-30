"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

type Props = {
  roleId: string;
  initialName: string;
  initialDescription: string | null;
  isSystem: boolean;
};

export default function RoleEditForm({ roleId, initialName, initialDescription, isSystem }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await getClientApi().roles.update(roleId, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setEditing(false);
      router.refresh();
    } catch {
      setError("Failed to update role.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete role "${initialName}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      await getClientApi().roles.delete(roleId);
      router.push("/admin/roles");
      router.refresh();
    } catch {
      setError("Failed to delete role. System roles cannot be deleted.");
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-emerald-600/30 hover:text-slate-100"
        >
          Edit
        </button>
        {!isSystem ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="role-edit-name"
          className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          Name
        </label>
        <input
          id="role-edit-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="cyber-input w-full"
        />
      </div>
      <div className="flex-[2]">
        <label
          htmlFor="role-edit-description"
          className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          Description
        </label>
        <input
          id="role-edit-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="cyber-input w-full"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="cyber-button">
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(initialName);
            setDescription(initialDescription ?? "");
            setError(null);
          }}
          className="cyber-button-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
