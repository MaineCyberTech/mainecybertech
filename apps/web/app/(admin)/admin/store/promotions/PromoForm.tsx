"use client";

import { useState, useCallback, type ReactNode } from "react";
import type { Promotion } from "@/lib/catalog/promotions";
import { createPromotionAction, updatePromotionAction } from "./actions";

const PROMO_TYPES = [
  { id: "bundle_savings", label: "Bundle Savings" },
  { id: "starter_credit", label: "Starter Credit" },
  { id: "seasonal_offer", label: "Seasonal Offer" },
  { id: "new_client_foundation", label: "New Client Foundation" },
  { id: "limited_capacity", label: "Limited Capacity" },
  { id: "free_addon", label: "Free Add-on" },
];

type Mode = "create" | "edit";

export default function PromoForm({
  mode,
  promotion,
  children,
}: {
  mode: Mode;
  promotion?: Promotion;
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
      const action = mode === "create" ? createPromotionAction : updatePromotionAction;
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
          <div className="relative z-10 w-full max-w-lg rounded-lg border border-white/10 bg-[#0F172A] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-50">
                {mode === "create" ? "Create Promotion" : "Edit Promotion"}
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
              {mode === "edit" && <input type="hidden" name="id" value={promotion!.id} />}

              <div>
                <label htmlFor="promo-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </label>
                <input
                  id="promo-name"
                  name="name"
                  required
                  defaultValue={promotion?.name ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-badgeText" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Badge Text
                  </label>
                  <input
                    id="promo-badgeText"
                    name="badgeText"
                    defaultValue={promotion?.badgeText ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="promo-promoType" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Type
                  </label>
                  <select
                    id="promo-promoType"
                    name="promoType"
                    defaultValue={promotion?.promoType ?? "bundle_savings"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    {PROMO_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="promo-detailText" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Detail Text
                </label>
                <textarea
                  id="promo-detailText"
                  name="detailText"
                  rows={2}
                  defaultValue={promotion?.detailText ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="promo-terms" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Terms & Conditions
                </label>
                <textarea
                  id="promo-terms"
                  name="terms"
                  rows={2}
                  required
                  defaultValue={promotion?.terms ?? ""}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Status
                  </label>
                  <select
                    id="promo-status"
                    name="status"
                    defaultValue={promotion?.status ?? "paused"}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo-startDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Start Date
                  </label>
                  <input
                    id="promo-startDate"
                    type="date"
                    name="startDate"
                    defaultValue={promotion?.startDate ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="promo-endDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    End Date
                  </label>
                  <input
                    id="promo-endDate"
                    type="date"
                    name="endDate"
                    defaultValue={promotion?.endDate ?? ""}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="promo-eligibilityTargets" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Eligibility Targets (comma-separated IDs, or &quot;all&quot;)
                </label>
                <input
                  id="promo-eligibilityTargets"
                  name="eligibilityTargets"
                  required
                  defaultValue={(promotion?.eligibilityTargets ?? []).join(", ")}
                  placeholder="all or prod-1, prod-2, cat-3"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0A1118] px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
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
