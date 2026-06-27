"use client";

import { useState } from "react";

type Org = Record<string, any> & { id: string; name?: string };
type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};
type ApiKeyWithSecret = ApiKey & { fullKey: string };

export default function AdminApiKeysClient({
  organizations,
  initialKeys,
}: {
  organizations: Org[];
  initialKeys: ApiKey[];
}) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newOrgId, setNewOrgId] = useState("");
  const [newKeyResult, setNewKeyResult] = useState<ApiKeyWithSecret | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newName.trim() || !newOrgId) return;
    setCreating(true);
    setError("");
    try {
      const { getClientApi } = await import("@/lib/client-api");
      const client = getClientApi();
      const result = await client.apiKeys.create({
        organizationId: newOrgId,
        name: newName.trim(),
      });
      setNewKeyResult(result);
      setKeys((prev) => [result, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewOrgId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const { getClientApi } = await import("@/lib/client-api");
      const client = getClientApi();
      await client.apiKeys.update(id, { isActive: !isActive });
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, is_active: !isActive } : k)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update API key");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key? This action cannot be undone.")) return;
    try {
      const { getClientApi } = await import("@/lib/client-api");
      const client = getClientApi();
      await client.apiKeys.remove(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API key");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      )}

      {newKeyResult && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
          <h4 className="font-semibold text-emerald-300">API Key Created</h4>
          <p className="mt-2 text-sm text-slate-300">Save this key now — it won&apos;t be shown again:</p>
          <div className="mt-2 rounded bg-[#0A1118] p-3 font-mono text-sm text-slate-200 break-all">
            {newKeyResult.fullKey}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(newKeyResult.fullKey); alert("Copied!"); }}
            className="mt-2 rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500"
          >
            Copy to clipboard
          </button>
          <button onClick={() => setNewKeyResult(null)} className="ml-2 text-xs text-slate-400 hover:text-slate-200">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{keys.length} API key{keys.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowCreate(!showCreate)} className="cyber-button text-sm">
          {showCreate ? "Cancel" : "Create API Key"}
        </button>
      </div>

      {showCreate && (
        <div className="cyber-panel space-y-4">
          <h3 className="cyber-heading text-lg">New API Key</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="cyber-label">Organization</label>
              <select value={newOrgId} onChange={(e) => setNewOrgId(e.target.value)} className="cyber-input">
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name ?? org.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="cyber-label">Key Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="cyber-input" placeholder="e.g. CI/CD Pipeline" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !newName.trim() || !newOrgId} className="cyber-button">
            {creating ? "Creating..." : "Generate Key"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {keys.length > 0 ? (
          keys.map((key) => (
            <div key={key.id} className="cyber-panel flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-50">{key.name}</p>
                  {key.is_active ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">Active</span>
                  ) : (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">Revoked</span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{key.key_prefix}...</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Created {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at ? ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}` : ""}
                  {key.expires_at ? ` · Expires ${new Date(key.expires_at).toLocaleDateString()}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => handleToggle(key.id, key.is_active)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition ${
                    key.is_active
                      ? "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  }`}
                >
                  {key.is_active ? "Revoke" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="rounded bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-6 text-center text-sm text-slate-400">
            No API keys found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
