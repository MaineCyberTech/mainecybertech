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

type CrudFormProps = {
  fields: Field[];
  title: string;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: () => void;
};

export default function CrudForm({ fields, title, action, onSuccess }: CrudFormProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await action(fd);
      if (result.ok) {
        setOpen(false);
        onSuccess?.();
      } else {
        setError(result.error ?? "Failed");
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
      >
        {title}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-white/10 bg-[#0A1118]/60 p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Cancel
        </button>
      </div>

      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={`crud-${f.key}`} className="mb-1 block text-xs font-medium text-slate-400">{f.label}</label>
          {f.type === "textarea" ? (
            <textarea
              id={`crud-${f.key}`}
              name={f.key}
              required={f.required}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
              rows={3}
            />
          ) : f.type === "select" && f.options ? (
            <select
              id={`crud-${f.key}`}
              name={f.key}
              required={f.required}
              className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <input
              id={`crud-${f.key}`}
              type="checkbox"
              name={f.key}
              className="h-4 w-4 rounded border-white/10 bg-[#0A1118] text-emerald-500 focus:ring-emerald-500/50"
            />
          ) : (
            <input
              id={`crud-${f.key}`}
              type={f.type ?? "text"}
              name={f.key}
              required={f.required}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-50 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
            />
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
