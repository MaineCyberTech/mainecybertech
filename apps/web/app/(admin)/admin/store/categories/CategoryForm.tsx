"use client";

import { useState, useCallback, type ReactNode } from "react";
import type { Category } from "@/lib/catalog/types";
import { createCategoryAction, updateCategoryAction } from "./actions";

type Mode = "create" | "edit";

export default function CategoryForm({
  mode,
  category,
  products,
  children,
}: {
  mode: Mode;
  category?: Category;
  products?: { id: string; name: string }[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setPending(true);
      setError("");

      const form = new FormData(e.currentTarget);
      const action = mode === "create" ? createCategoryAction : updateCategoryAction;
      const result = await action({ ok: true }, form);

      if (!result.ok) {
        setError(result.error ?? "Unknown error");
        setPending(false);
      } else {
        setOpen(false);
        setPending(false);
      }
    },
    [mode],
  );

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-50">
                {mode === "create" ? "Create Category" : "Edit Category"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "edit" && <input type="hidden" name="id" value={category!.id} />}

              <div>
                <label
                  htmlFor="cat-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Name
                </label>
                <input
                  id="cat-name"
                  name="name"
                  required
                  defaultValue={category?.name ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cat-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Slug
                </label>
                <input
                  id="cat-slug"
                  name="slug"
                  required
                  defaultValue={category?.slug ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cat-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Description
                </label>
                <textarea
                  id="cat-description"
                  name="description"
                  rows={3}
                  defaultValue={category?.description ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="cat-productIds"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Product IDs (comma-separated)
                </label>
                <input
                  id="cat-productIds"
                  name="productIds"
                  defaultValue={(category?.productIds ?? []).join(", ")}
                  placeholder="prod-1, prod-2"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 transition hover:border-emerald-600/30 hover:text-slate-200"
                  disabled={pending}
                >
                  Cancel
                </button>
                <button type="submit" className="cyber-button" disabled={pending}>
                  {pending ? "Saving..." : mode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
