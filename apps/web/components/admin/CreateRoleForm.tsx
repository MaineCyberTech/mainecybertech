"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getClientApi } from "@/lib/client-api";

export default function CreateRoleForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const role = await getClientApi().roles.create({
        key: key.trim(),
        name: name.trim(),
        description: description.trim() || null,
      });
      router.push(`/admin/roles/${role.id}`);
      router.refresh();
    } catch {
      setError("Failed to create role. The key may already be in use.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="cyber-button">
        Create Role
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(false)} className="cyber-button-secondary">
        Cancel
      </button>
      <form
        onSubmit={handleSubmit}
        className="absolute right-0 top-12 z-40 w-80 space-y-3 rounded-lg border border-white/10 bg-[#0F172A] p-4 shadow-2xl"
      >
        <p className="text-sm font-semibold text-slate-100">Create Role</p>
        <div>
          <label
            htmlFor="role-key"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Key
          </label>
          <input
            id="role-key"
            type="text"
            required
            pattern="[a-z0-9_-]+"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="cyber-input w-full"
            placeholder="e.g. security_analyst"
          />
          <p className="mt-1 text-[10px] text-slate-500">
            Lowercase letters, numbers, underscores, dashes.
          </p>
        </div>
        <div>
          <label
            htmlFor="role-name"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Name
          </label>
          <input
            id="role-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cyber-input w-full"
            placeholder="e.g. Security Analyst"
          />
        </div>
        <div>
          <label
            htmlFor="role-description"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Description
          </label>
          <textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="cyber-input w-full"
            rows={2}
            placeholder="What does this role do?"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className="cyber-button w-full">
          {loading ? "Creating..." : "Create Role"}
        </button>
      </form>
    </div>
  );
}
