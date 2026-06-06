"use client";

import { useState } from "react";
import { getClientApi } from "@/lib/client-api";

type Props = {
  organizations: { id: string; name: string }[];
  roles: { id: string; name: string; key: string }[];
};

type Result = {
  email: string;
  status: string;
  message: string;
};

export default function BulkInviteForm({ organizations, roles }: Props) {
  const [csv, setCsv] = useState("");
  const [orgId, setOrgId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !roleId || !csv.trim()) return;
    setSubmitting(true);
    setResults(null);

    try {
      const invites = csv.trim().split("\n").filter(Boolean).map((line) => {
        const [email, ...nameParts] = line.split(",").map((s) => s.trim());
        return { email, fullName: nameParts.join(", ") || undefined };
      });
      const result = await getClientApi().bulk.invite({ organizationId: orgId, roleId, invites });
      setResults(result.results as unknown as Result[]);
    } catch {
      setResults([{ email: "", status: "error", message: "Request failed" }]);
    }
    setSubmitting(false);
  }

  const created = results?.filter((r) => r.status === "created").length ?? 0;
  const invited = results?.filter((r) => r.status === "invited").length ?? 0;
  const skipped = results?.filter((r) => r.status === "skipped").length ?? 0;
  const errors = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="cyber-label">Organization</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)} required className="cyber-input">
            <option value="">Select...</option>
            {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div>
          <label className="cyber-label">Role</label>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} required className="cyber-input">
            <option value="">Select...</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.key})</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="cyber-label">Users (CSV)</label>
        <p className="mt-1 text-xs text-slate-500 mb-2">One per line: <code>email, full_name</code></p>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)}
          rows={10} className="cyber-input font-mono text-sm" required
          placeholder={"user1@example.com, Alice Smith\nuser2@example.com, Bob Jones\nuser3@example.com, Carol Lee"} />
      </div>

      <button type="submit" disabled={submitting} className="cyber-button">
        {submitting ? "Processing..." : "Import Users"}
      </button>

      {results ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-emerald-400">{invited} invited</span>
            <span className="text-blue-400">{created} created</span>
            <span className="text-amber-400">{skipped} skipped</span>
            {errors > 0 ? <span className="text-red-400">{errors} errors</span> : null}
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 rounded px-3 py-2 text-xs ${
                r.status === "invited" ? "bg-emerald-500/5 text-emerald-300"
                : r.status === "created" ? "bg-blue-500/5 text-blue-300"
                : r.status === "skipped" ? "bg-amber-500/5 text-amber-300"
                : "bg-red-500/5 text-red-300"
              }`}>
                <span className="font-medium w-48 truncate">{r.email}</span>
                <span className="capitalize">{r.status}</span>
                <span className="text-slate-500">{r.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
