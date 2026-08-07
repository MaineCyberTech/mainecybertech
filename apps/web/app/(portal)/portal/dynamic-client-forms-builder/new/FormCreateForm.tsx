"use client";

import { useState, useTransition } from "react";
import { createFormAction } from "../actions";

export default function FormCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldsJson, setFieldsJson] = useState(
    '[{"key":"name","label":"Name","type":"text","required":true}]',
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.set("fields", fieldsJson);
    startTransition(async () => {
      const result = await createFormAction(fd);
      if (result && !result.ok) setError(result.error ?? "Failed to create");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-4">
      <div>
        <label htmlFor="f-title" className="mb-1 block text-xs font-medium text-slate-400">
          Form Title *
        </label>
        <input
          id="f-title"
          name="title"
          required
          placeholder="e.g. Office Access Request"
          className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-type" className="mb-1 block text-xs font-medium text-slate-400">
            Form Type
          </label>
          <select
            id="f-type"
            name="formType"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          >
            <option value="request">Request</option>
            <option value="access_request">Access Request</option>
            <option value="onboarding">Onboarding</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-desc" className="mb-1 block text-xs font-medium text-slate-400">
            Description
          </label>
          <input
            id="f-desc"
            name="description"
            className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-50 focus:border-emerald-500/50 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label htmlFor="f-fields" className="mb-1 block text-xs font-medium text-slate-400">
          Fields (JSON array: key, label, type, options?)
        </label>
        <textarea
          id="f-fields"
          value={fieldsJson}
          onChange={(e) => setFieldsJson(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-white/10 bg-cyber-base px-3 py-2 font-mono text-xs text-slate-50 focus:border-emerald-500/50 focus:outline-none"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Example: [{'{key: "department", label: "Department", type: "text"}'}]
        </p>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Form"}
      </button>
    </form>
  );
}
