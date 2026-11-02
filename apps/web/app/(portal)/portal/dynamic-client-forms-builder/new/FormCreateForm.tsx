"use client";

import { useState, useTransition } from "react";
import { createFormAction } from "../actions";

type FieldDraft = {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string;
  placeholder: string;
  helpText: string;
};

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
];

function slug(value: string, index: number): string {
  const key = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return key || `field_${index + 1}`;
}

const emptyField = (index: number): FieldDraft => ({
  key: `field_${index + 1}`,
  label: "",
  type: "text",
  required: false,
  options: "",
  placeholder: "",
  helpText: "",
});

export default function FormCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([
    { ...emptyField(0), key: "name", label: "Name", required: true },
  ]);

  function updateField(index: number, patch: Partial<FieldDraft>) {
    setFields((current) =>
      current.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  }

  function move(index: number, direction: -1 | 1) {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const labelled = fields.filter((field) => field.label.trim().length > 0);
    if (labelled.length === 0) {
      setError("Add at least one field.");
      return;
    }

    const payload = labelled.map((field, index) => ({
      key: slug(field.key || field.label, index),
      label: field.label.trim(),
      type: field.type,
      required: field.required,
      options:
        field.type === "select"
          ? field.options
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean)
          : [],
      placeholder: field.placeholder.trim() || null,
      helpText: field.helpText.trim() || null,
      validation: {},
      sortOrder: index,
    }));

    const fd = new FormData(e.currentTarget as HTMLFormElement);
    fd.set("fields", JSON.stringify(payload));
    startTransition(async () => {
      const result = await createFormAction(fd);
      if (result && !result.ok) setError(result.error ?? "Failed to create");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="cyber-panel space-y-5">
      <div>
        <label htmlFor="f-title" className="cyber-label">
          Form title *
        </label>
        <input
          id="f-title"
          name="title"
          required
          placeholder="e.g. Office Access Request"
          className="cyber-input"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="f-type" className="cyber-label">
            Form type
          </label>
          <select id="f-type" name="formType" className="cyber-input" defaultValue="access_request">
            <option value="intake">Intake</option>
            <option value="survey">Survey</option>
            <option value="questionnaire">Questionnaire</option>
            <option value="access_request">Access request</option>
            <option value="incident_report">Incident report</option>
            <option value="approval">Approval</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-desc" className="cyber-label">
            Description
          </label>
          <input id="f-desc" name="description" className="cyber-input" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Fields</h2>
          <button
            type="button"
            onClick={() => setFields((current) => [...current, emptyField(current.length)])}
            className="cyber-button-secondary text-xs"
          >
            Add field
          </button>
        </div>

        {fields.map((field, index) => (
          <div
            key={index}
            className="space-y-3 rounded-lg border border-white/10 bg-cyber-base/60 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Field {index + 1}
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-30"
                  aria-label="Move field up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === fields.length - 1}
                  className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/5 disabled:opacity-30"
                  aria-label="Move field down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => setFields((current) => current.filter((_, i) => i !== index))}
                  disabled={fields.length === 1}
                  className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-30"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="cyber-label" htmlFor={`field-label-${index}`}>
                  Label *
                </label>
                <input
                  id={`field-label-${index}`}
                  value={field.label}
                  onChange={(event) =>
                    updateField(index, {
                      label: event.target.value,
                      key: field.key.startsWith("field_")
                        ? slug(event.target.value, index)
                        : field.key,
                    })
                  }
                  className="cyber-input"
                  placeholder="Department"
                />
              </div>
              <div>
                <label className="cyber-label" htmlFor={`field-key-${index}`}>
                  Key
                </label>
                <input
                  id={`field-key-${index}`}
                  value={field.key}
                  onChange={(event) => updateField(index, { key: event.target.value })}
                  className="cyber-input font-mono text-xs"
                />
              </div>
              <div>
                <label className="cyber-label" htmlFor={`field-type-${index}`}>
                  Type
                </label>
                <select
                  id={`field-type-${index}`}
                  value={field.type}
                  onChange={(event) => updateField(index, { type: event.target.value })}
                  className="cyber-input"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cyber-label" htmlFor={`field-placeholder-${index}`}>
                  Placeholder
                </label>
                <input
                  id={`field-placeholder-${index}`}
                  value={field.placeholder}
                  onChange={(event) => updateField(index, { placeholder: event.target.value })}
                  className="cyber-input"
                />
              </div>
            </div>

            {field.type === "select" ? (
              <div>
                <label className="cyber-label" htmlFor={`field-options-${index}`}>
                  Options (comma separated)
                </label>
                <input
                  id={`field-options-${index}`}
                  value={field.options}
                  onChange={(event) => updateField(index, { options: event.target.value })}
                  className="cyber-input"
                  placeholder="Low, Medium, High"
                />
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="cyber-label" htmlFor={`field-help-${index}`}>
                  Help text
                </label>
                <input
                  id={`field-help-${index}`}
                  value={field.helpText}
                  onChange={(event) => updateField(index, { helpText: event.target.value })}
                  className="cyber-input"
                />
              </div>
              <label className="flex items-end gap-2 pb-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(event) => updateField(index, { required: event.target.checked })}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                Required
              </label>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="cyber-button">
        {pending ? "Creating..." : "Create Form"}
      </button>
    </form>
  );
}
