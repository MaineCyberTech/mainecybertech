"use client";

import { useState, useEffect, useCallback } from "react";
import { getClientApi } from "@/lib/client-api";
import { restoreDocumentVersionAction } from "@/app/(portal)/portal/documents/[documentId]/actions";
import { formErrorMessage } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";

type Version = {
  id: string;
  version_number: number;
  uploaded_by: string;
  created_at: string;
};

type Props = {
  documentId: string;
  /** Current document version; the matching row is the one in force. */
  currentVersion?: number | null;
};

export default function DocumentVersionsClient({ documentId, currentVersion }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await getClientApi().documents.listVersions(documentId);
      setVersions(result.items);
    } catch (error) {
      // USE-P3-003: a failed load must not look like "no history".
      setLoadError(formErrorMessage(error, "Could not load version history."));
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function downloadVersion(version: Version) {
    setBusyId(version.id);
    setMessage(null);
    try {
      const { signedUrl } = await getClientApi().documents.createVersionSignedUrl(
        documentId,
        version.id,
      );
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage({
        tone: "error",
        text: formErrorMessage(error, "Could not create a download link for this version."),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function restoreVersion(version: Version) {
    setBusyId(version.id);
    setMessage(null);
    try {
      const result = await restoreDocumentVersionAction(documentId, version.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error ?? "Restore failed." });
        return;
      }
      setMessage({
        tone: "success",
        text: `Version ${version.version_number} was restored as version ${result.version ?? ""}.`.trim(),
      });
      await fetchVersions();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="py-2 text-xs text-slate-400">Loading versions...</div>;

  // USE-P3-003: show the section even for a single version — the version
  // number and upload time are useful, and the empty state must be explicit.
  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-cyber-base/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        Version History
      </p>

      {loadError ? (
        <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-xs text-red-300">
          <span>{loadError}</span>
          <button
            type="button"
            className="cyber-button-secondary text-xs"
            onClick={() => {
              setLoading(true);
              void fetchVersions();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loadError && versions.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">No version history recorded yet.</p>
      ) : null}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={`mt-3 text-xs ${message.tone === "error" ? "text-red-300" : "text-emerald-300"}`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        {versions.map((v) => {
          const isCurrent = currentVersion != null && v.version_number === currentVersion;
          return (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-600/15 px-1.5 py-0.5 font-mono text-emerald-400">
                  v{v.version_number}
                </span>
                <span className="text-slate-400">{formatDateTime(v.created_at)}</span>
                {isCurrent ? (
                  <span className="rounded border border-emerald-500/25 px-1.5 py-0.5 text-emerald-300">
                    Current
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cyber-button-secondary text-xs"
                  disabled={busyId === v.id}
                  onClick={() => void downloadVersion(v)}
                >
                  {busyId === v.id ? "Working..." : "Download"}
                </button>
                {!isCurrent ? (
                  <button
                    type="button"
                    className="cyber-button-secondary text-xs"
                    disabled={busyId === v.id}
                    onClick={() => void restoreVersion(v)}
                  >
                    Restore
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
