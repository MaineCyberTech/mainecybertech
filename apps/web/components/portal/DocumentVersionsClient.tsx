"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";

type Version = {
  id: string;
  version_number: number;
  uploaded_by: string;
  created_at: string;
};

type Props = {
  documentId: string;
};

export default function DocumentVersionsClient({ documentId }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVersions = useCallback(async () => {
    try {
      const result = await getClientApi().documents.listVersions(documentId);
      setVersions(result.items);
    } catch {}
    setLoading(false);
  }, [documentId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  if (loading) return <div className="text-xs text-slate-500 py-2">Loading versions...</div>;
  if (versions.length <= 1) return null;

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-[#0A1118]/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Version History</p>
      <div className="mt-3 space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-600/15 px-1.5 py-0.5 font-mono text-emerald-400">v{v.version_number}</span>
              <span className="text-slate-400">{new Date(v.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
