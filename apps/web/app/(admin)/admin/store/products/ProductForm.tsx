"use client";

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Button } from "@mct/ui/components/Button";
import { Input, Textarea } from "@mct/ui/components/Input";
import { useFocusTrap } from "@/lib/use-focus-trap";
import type {
  CatalogProduct,
  PricingModel,
  PurchaseMode,
  RiskLevel,
  DeliveryEffort,
} from "@/lib/catalog/types";
import { createProductAction, updateProductAction } from "./actions";

const PRICING_MODELS: PricingModel[] = [
  "one_time_or_project",
  "recurring_monthly",
  "tiered_monthly",
  "retainer",
];

const PURCHASE_MODES: PurchaseMode[] = [
  "consultation_or_checkout",
  "consultation_required",
  "direct_checkout",
  "retainer_or_subscription",
];

const RISK_LEVELS: RiskLevel[] = ["normal", "elevated", "high", "emergency"];
const DELIVERY_EFFORTS: DeliveryEffort[] = ["standard", "medium", "complex"];

type Mode = "create" | "edit";

export default function ProductForm({
  mode,
  product,
  children,
}: {
  mode: Mode;
  product?: CatalogProduct;
  categories?: { id: string; name: string }[];
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
      const action = mode === "create" ? createProductAction : updateProductAction;
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
            aria-labelledby="product-form-title"
            ref={dialogRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
            className="relative z-10 max-h-[90vh] w-[calc(100vw-2rem)] min-w-0 max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="product-form-title" className="text-lg font-bold text-slate-50">
                {mode === "create" ? "Create Product" : "Edit Product"}
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
              {mode === "edit" && <input type="hidden" name="id" value={product!.id} />}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="prod-name"
                  name="name"
                  label="Name"
                  required
                  defaultValue={product?.name ?? ""}
                />
                <Input
                  id="prod-slug"
                  name="slug"
                  label="Slug"
                  required
                  defaultValue={product?.slug ?? ""}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="prod-categoryId"
                  name="categoryId"
                  label="Category ID"
                  defaultValue={product?.categoryId ?? ""}
                />
                <Input
                  id="prod-category"
                  name="category"
                  label="Category (label)"
                  defaultValue={product?.category ?? ""}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  id="prod-type"
                  name="type"
                  label="Type"
                  defaultValue={product?.type ?? "service"}
                />
                <Input
                  id="prod-status"
                  name="status"
                  label="Status"
                  defaultValue={product?.status ?? "draft"}
                />
                <Input
                  id="prod-priceRange"
                  name="priceRange"
                  label="Price Range"
                  defaultValue={product?.priceRange ?? ""}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="prod-pricingModel"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Pricing Model
                  </label>
                  <select
                    id="prod-pricingModel"
                    name="pricingModel"
                    defaultValue={product?.pricingModel ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50"
                  >
                    <option value="">—</option>
                    {PRICING_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prod-purchaseMode"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Purchase Mode
                  </label>
                  <select
                    id="prod-purchaseMode"
                    name="purchaseMode"
                    defaultValue={product?.purchaseMode ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50"
                  >
                    <option value="">—</option>
                    {PURCHASE_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                id="prod-summary"
                name="summary"
                label="Summary"
                rows={2}
                defaultValue={product?.summary ?? ""}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="prod-marketingHeadline"
                  name="marketingHeadline"
                  label="Marketing Headline"
                  defaultValue={product?.marketingHeadline ?? ""}
                />
                <Input
                  id="prod-tags"
                  name="tags"
                  label="Tags (comma-separated)"
                  defaultValue={(product?.tags ?? []).join(", ")}
                />
              </div>

              <Textarea
                id="prod-marketingCopy"
                name="marketingCopy"
                label="Marketing Copy"
                rows={3}
                defaultValue={product?.marketingCopy ?? ""}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="prod-riskLevel"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Risk Level (attribute)
                  </label>
                  <select
                    id="prod-riskLevel"
                    name="riskLevel"
                    defaultValue={product?.riskLevel ?? "normal"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50"
                  >
                    {RISK_LEVELS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="prod-deliveryEffort"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Delivery Effort (attribute)
                  </label>
                  <select
                    id="prod-deliveryEffort"
                    name="deliveryEffort"
                    defaultValue={product?.deliveryEffort ?? "standard"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50"
                  >
                    {DELIVERY_EFFORTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <input
                      type="checkbox"
                      name="bundleEligible"
                      value="true"
                      defaultChecked={product?.bundleEligible ?? false}
                    />
                    Bundle Eligible
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <input
                      type="checkbox"
                      name="display"
                      value="true"
                      defaultChecked={product?.display ?? true}
                    />
                    Display
                  </label>
                </div>
              </div>

              <Textarea
                id="prod-attributes"
                name="attributes"
                label="Extra attributes (JSON)"
                rows={3}
                placeholder='{"intakeFields": [], "fulfillmentWorkflow": []}'
                className="font-mono text-xs"
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
