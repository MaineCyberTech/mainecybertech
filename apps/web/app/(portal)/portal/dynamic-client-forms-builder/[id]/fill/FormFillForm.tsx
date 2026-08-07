"use client";

import { useState, useTransition } from "react";
import { submitFormAction } from "../../actions";

export default function FormFillForm({ formId, fields }: { formId: string; fields: any[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    startTransition(async () => {
      const result = await submitFormAction(formId, fd);
      if (result.ok) setDone(true);
      else setError(result.error ?? "Failed to submit");
    });
  };

  if (done) {
    return (
      <div className="cyber-panel p-8 text-center">
        <p className="text-emerald-300">Your response was submitted. Thank you!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      {fields.length === 0 && (
        <p className="text-sm text-slate-400">This form has no fields configured.</p>
      )}
      {fields.map((field, i) => {
        const key = String(field.key ?? `field_${i}`);
        const label = String(field.label ?? key);
        const required = Boolean(field.required);
        const type = String(field.type ?? "text");
        return (
          <div key={key}>
            <label htmlFor={`f_${key}`} className="mb-1 block text-xs font-medium text-slate-400">
              {label}
              {required && " *"}
            </label>
            {type === "textarea" ? (
              <textarea
                id={`f_${key}`}
                name={`f_${key}`}
                required={required}
                rows={3}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              />
            ) : type === "select" ? (
              <select
                id={`f_${key}`}
                name={`f_${key}`}
                required={required}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              >
                <option value="">Select...</option>
                {(field.options ?? []).map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`f_${key}`}
                name={`f_${key}`}
                type={type === "number" ? "number" : "text"}
                required={required}
                className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
              />
            )}
          </div>
        );
      })}
      <div>
        <label htmlFor="f-email" className="mb-1 block text-xs font-medium text-slate-400">
          Your email (optional)
        </label>
        <input
          id="f-email"
          name="respondentEmail"
          type="email"
          className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit Response"}
      </button>
    </form>
  );
}
