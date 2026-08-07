"use client";

import { useState, useTransition } from "react";

type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type RecordDetailProps = {
  id: string;
  record: Record<string, unknown> | null;
  fields: Field[];
  updateAction: (id: string, formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  onUpdate: () => void;
  parentHref: string;
  parentLabel: string;
  deleteAction?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onDelete?: () => void;
};

function snakeToLabel(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSnakeCase(k: string): string {
  return k.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
}

function recordValue(record: Record<string, unknown>, key: string): unknown {
  if (record[key] !== undefined && record[key] !== null) return record[key];
  return record[toSnakeCase(key)];
}

export default function RecordDetail({
  id,
  record,
  fields,
  updateAction,
  onUpdate,
  parentHref,
  parentLabel,
  deleteAction,
  onDelete,
}: RecordDetailProps) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleDelete = () => {
    if (!deleteAction || !window.confirm("Delete this record? This cannot be undone.")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteAction(id);
      if (result.ok) {
        onDelete?.();
      } else {
        setError(result.error ?? "Delete failed");
      }
    });
  };

  if (!record) {
    return (
      <div className="cyber-panel p-8 text-center">
        <p className="text-slate-400">Record not found.</p>
        <a
          href={parentHref}
          className="mt-4 inline-block text-sm text-emerald-500 hover:text-emerald-400"
        >
          Back to {parentLabel}
        </a>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await updateAction(id, fd);
      if (result.ok) {
        setEditing(false);
        onUpdate();
      } else {
        setError(result.error ?? "Update failed");
      }
    });
  };

  const displayFields = fields.filter(
    (f) => !["organizationId", "organization_id"].includes(f.key),
  );
  const editFields = fields.filter((f) => f.key !== "organizationId");

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-white/10 bg-cyber-base/60 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-50">Edit Record</h3>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
        {editFields.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={`edit-${f.key}`}
              className="mb-1 block text-xs font-medium text-slate-400"
            >
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={`edit-${f.key}`}
                name={f.key}
                defaultValue={String(recordValue(record, f.key) ?? "")}
                required={f.required}
                rows={3}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              />
            ) : f.type === "select" && f.options ? (
              <select
                id={`edit-${f.key}`}
                name={f.key}
                defaultValue={String(recordValue(record, f.key) ?? "")}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`edit-${f.key}`}
                type={f.type ?? "text"}
                name={f.key}
                defaultValue={String(recordValue(record, f.key) ?? "")}
                required={f.required}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              />
            )}
          </div>
        ))}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-cyber-base/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <a href={parentHref} className="text-sm text-emerald-500 hover:text-emerald-400">
            &larr; {parentLabel}
          </a>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-500/20"
        >
          Edit
        </button>
        {deleteAction && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {displayFields.map((f) => {
          const val = recordValue(record, f.key);
          const display =
            val === null || val === undefined || val === ""
              ? "—"
              : typeof val === "boolean"
                ? val
                  ? "Yes"
                  : "No"
                : String(val).length > 200
                  ? String(val).slice(0, 200) + "..."
                  : String(val);
          return (
            <div key={f.key}>
              <dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-400">
                {snakeToLabel(f.key)}
              </dt>
              <dd className="mt-1 text-sm text-slate-50">{display}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
