import type { FormEvent } from "react";
import StatusPill from "./StatusPill";
import { docName } from "./helpers";
import type { DocumentRecord } from "./types";

export default function QuickEditPanel({
  doc,
  open,
  busyId,
  successMap,
  onSubmit,
  onCancel,
}: {
  doc: DocumentRecord;
  open: boolean;
  busyId: string | null;
  successMap: Record<string, string>;
  onSubmit: (event: FormEvent<HTMLFormElement>, doc: DocumentRecord) => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <form
      onSubmit={(e) => {
        onSubmit(e, doc);
      }}
      className="mt-4 grid gap-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4 md:grid-cols-2"
    >
      <div>
        <label className="cyber-label" htmlFor="doc-name">
          Name
        </label>
        <input
          id="doc-name"
          name="name"
          className="cyber-input"
          defaultValue={docName(doc)}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        />
      </div>
      <div>
        <label className="cyber-label" htmlFor="doc-folder">
          Folder
        </label>
        <input
          id="doc-folder"
          name="category"
          className="cyber-input"
          defaultValue={String(doc.folder_path ?? "")}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        />
      </div>
      <div className="md:col-span-2">
        <label className="cyber-label" htmlFor="doc-description">
          Description
        </label>
        <textarea
          id="doc-description"
          name="description"
          rows={3}
          className="cyber-input"
          defaultValue={String(doc.description ?? "")}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        />
      </div>
      <div className="md:col-span-2">
        <label className="cyber-label" htmlFor="doc-storage-path">
          Storage Path
        </label>
        <input
          id="doc-storage-path"
          name="storagePath"
          className="cyber-input"
          defaultValue={String(doc.storage_path ?? "")}
          disabled={Boolean(busyId?.endsWith(doc.id))}
        />
      </div>
      <div className="flex items-center justify-between gap-3 md:col-span-2">
        <StatusPill docId={doc.id} busyId={busyId} successMap={successMap} />
        <div className="flex gap-3">
          <button type="button" className="cyber-button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="cyber-button"
            disabled={busyId === `metadata:${doc.id}`}
          >
            {busyId === `metadata:${doc.id}` ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}
