"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Button } from "@mct/ui/components/Button";
import { Input, Textarea } from "@mct/ui/components/Input";
import type { Category } from "@/lib/catalog/types";
import { createCategoryAction, updateCategoryAction } from "./actions";
import { useFocusTrap } from "@/lib/use-focus-trap";

type Mode = "create" | "edit";

export default function CategoryForm({
  mode,
  category,
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            ref={dialogRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="relative z-10 max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="category-form-title" className="text-lg font-bold text-slate-50">
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

              <Input
                id="cat-name"
                name="name"
                label="Name"
                required
                defaultValue={category?.name ?? ""}
              />

              <Input
                id="cat-slug"
                name="slug"
                label="Slug"
                required
                defaultValue={category?.slug ?? ""}
              />

              <Textarea
                id="cat-description"
                name="description"
                label="Description"
                rows={3}
                defaultValue={category?.description ?? ""}
              />

              <Input
                id="cat-productIds"
                name="productIds"
                label="Product IDs (comma-separated)"
                defaultValue={(category?.productIds ?? []).join(", ")}
                placeholder="prod-1, prod-2"
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? "Saving..." : mode === "create" ? "Create" : "Update"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
