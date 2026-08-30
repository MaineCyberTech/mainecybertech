"use client";

import { useState, useCallback, type ReactNode } from "react";
import type { CatalogProduct, PricingModel, PurchaseMode, RiskLevel, DeliveryEffort } from "@/lib/catalog/types";
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
  categories,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-white/10 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-50">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prod-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Name
                  </label>
                  <input
                    id="prod-name"
                    name="name"
                    required
                    defaultValue={product?.name ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-slug"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Slug
                  </label>
                  <input
                    id="prod-slug"
                    name="slug"
                    required
                    defaultValue={product?.slug ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prod-categoryId"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Category ID
                  </label>
                  <input
                    id="prod-categoryId"
                    name="categoryId"
                    defaultValue={product?.categoryId ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Category (label)
                  </label>
                  <input
                    id="prod-category"
                    name="category"
                    defaultValue={product?.category ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="prod-type"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Type
                  </label>
                  <input
                    id="prod-type"
                    name="type"
                    defaultValue={product?.type ?? "service"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-status"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Status
                  </label>
                  <input
                    id="prod-status"
                    name="status"
                    defaultValue={product?.status ?? "draft"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-priceRange"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Price Range
                  </label>
                  <input
                    id="prod-priceRange"
                    name="priceRange"
                    defaultValue={product?.priceRange ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
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

              <div>
                <label
                  htmlFor="prod-summary"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Summary
                </label>
                <textarea
                  id="prod-summary"
                  name="summary"
                  rows={2}
                  defaultValue={product?.summary ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prod-marketingHeadline"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Marketing Headline
                  </label>
                  <input
                    id="prod-marketingHeadline"
                    name="marketingHeadline"
                    defaultValue={product?.marketingHeadline ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-tags"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    id="prod-tags"
                    name="tags"
                    defaultValue={(product?.tags ?? []).join(", ")}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prod-marketingCopy"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Marketing Copy
                </label>
                <textarea
                  id="prod-marketingCopy"
                  name="marketingCopy"
                  rows={3}
                  defaultValue={product?.marketingCopy ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
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

              <div>
                <label
                  htmlFor="prod-attributes"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Extra attributes (JSON)
                </label>
                <textarea
                  id="prod-attributes"
                  name="attributes"
                  rows={3}
                  placeholder='{"intakeFields": [], "fulfillmentWorkflow": []}'
                  className="mt-1 w-full rounded-lg border border-white/10 bg-cyber-base px-3 py-2 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
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
