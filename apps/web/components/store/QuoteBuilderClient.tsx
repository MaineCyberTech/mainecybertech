"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog/types";
import { getClientApi } from "@/lib/client-api";
import {
  getQuoteItems,
  addToQuote,
  removeFromQuote,
  clearQuote,
} from "@/lib/catalog/quote-storage";

interface QuoteBuilderClientProps {
  products: CatalogProduct[];
}

interface QuoteItem {
  productId: string;
  name: string;
  priceRange: string;
  riskLevel: string;
  purchaseMode: string;
  tags: string[];
}

interface QuoteForm {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

function getPromoEligibility(item: QuoteItem): string[] | null {
  const badges: string[] = [];
  if (item.tags.includes("quick-win")) badges.push("Quick-win starter credit eligible");
  return badges.length > 0 ? badges : null;
}

function isConsultRequired(purchaseMode: string): boolean {
  return purchaseMode === "consultation_required" || purchaseMode === "consultation_or_checkout";
}

function productToQuoteItem(product: CatalogProduct): QuoteItem {
  return {
    productId: product.id,
    name: product.name,
    priceRange: product.priceRange,
    riskLevel: product.riskLevel,
    purchaseMode: product.purchaseMode,
    tags: product.tags,
  };
}

export default function QuoteBuilderClient({ products }: QuoteBuilderClientProps) {
  const quickWins = products.filter((p) => p.tags.includes("quick-win") && p.display);
  const bundles = products.filter((p) => p.tags.includes("bundle") && p.display);
  const monthlyPlans = products.filter((p) => p.categoryId === "monthly-it-plans" && p.display);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState<QuoteForm>({ name: "", email: "", phone: "", notes: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const merged: QuoteItem[] = [];
    const seen = new Set<string>();

    // Load from legacy mct_quote (full objects)
    try {
      const raw = localStorage.getItem("mct_quote");
      if (raw) {
        const parsed = JSON.parse(raw) as QuoteItem[];
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!seen.has(item.productId)) {
              seen.add(item.productId);
              merged.push(item);
            }
          }
        }
      }
    } catch {
      /* ignore */
    }

    // Load from shared mct_quote_items (slugs) and resolve to full objects
    const slugs = getQuoteItems();
    for (const slug of slugs) {
      const product = products.find((p) => p.slug === slug);
      if (product && !seen.has(product.id)) {
        seen.add(product.id);
        merged.push(productToQuoteItem(product));
      }
    }

    setItems(merged);
    setLoaded(true);
  }, [products]);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("mct_quote", JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((product: CatalogProduct) => {
    setItems((prev) => {
      if (prev.some((i) => i.productId === product.id)) return prev;
      addToQuote(product.slug);
      return [...prev, productToQuoteItem(product)];
    });
  }, []);

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const product = products.find((p) => p.id === productId);
        if (product) removeFromQuote(product.slug);
        return prev.filter((i) => i.productId !== productId);
      });
    },
    [products],
  );

  function renderProductList(label: string, list: CatalogProduct[]) {
    if (list.length === 0) return null;
    return (
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </h3>
        <div className="space-y-2">
          {list.map((p) => {
            const alreadyAdded = items.some((i) => i.productId === p.id);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0A1118]/60 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-50">{p.name}</p>
                  <p className="text-xs text-emerald-400">{p.priceRange}</p>
                </div>
                <button
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => addItem(p)}
                  className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition enabled:border enabled:border-emerald-600/30 enabled:bg-emerald-600/10 enabled:text-emerald-400 enabled:hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {alreadyAdded ? "Added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setStatus({ type: "error", message: "Please add at least one service to your quote." });
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setStatus({ type: "error", message: "Name, email, and phone are required." });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      await getClientApi().store.submitQuote({
        name: form.name,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          priceRange: i.priceRange,
        })),
      });
      setStatus({
        type: "success",
        message:
          "Your quote request has been submitted. A member of our team will follow up with you shortly.",
      });
      setItems([]);
      setForm({ name: "", email: "", phone: "", notes: "" });
      localStorage.removeItem("mct_quote");
      clearQuote();
    } catch {
      setStatus({
        type: "error",
        message: "Submission failed. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-orbitron mb-8 text-center text-3xl font-bold uppercase tracking-wider text-slate-50 sm:text-4xl">
        Build Your <span className="text-emerald-500">Quote</span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {renderProductList("Quick Wins", quickWins)}
          {renderProductList("Bundles", bundles)}
          {renderProductList("Monthly Plans", monthlyPlans)}
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-lg border border-white/10 bg-[#0A1118]/60 p-4">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-50">
                Your Quote ({items.length})
              </h2>

              {items.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Select services from the left or browse the{" "}
                  <Link href="/store" className="text-emerald-400 underline">
                    store
                  </Link>{" "}
                  to build your quote.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded border border-white/10 bg-[#0A1118]/40 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-50">{item.name}</p>
                          <p className="text-xs text-emerald-400">{item.priceRange}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="shrink-0 rounded px-2 py-0.5 text-[11px] text-red-400 transition hover:bg-red-500/10"
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </div>

                      {getPromoEligibility(item) && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {getPromoEligibility(item)!.map((badge) => (
                            <span
                              key={badge}
                              className="inline-flex rounded-full border border-emerald-600/20 bg-emerald-600/5 px-2 py-0.5 text-[10px] text-emerald-400"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      {isConsultRequired(item.purchaseMode) && (
                        <p className="mt-2 text-[10px] text-amber-400">
                          Consult required — final pricing depends on scope.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/store"
              className="font-orbitron block w-full rounded border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-emerald-400 transition hover:bg-emerald-600/20"
            >
              + Add More Products
            </Link>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="quote-name"
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="quote-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="quote-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  Email <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="quote-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="quote-phone"
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  Phone <span className="text-emerald-400">*</span>
                </label>
                <input
                  id="quote-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="quote-notes"
                  className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  Notes
                </label>
                <textarea
                  id="quote-notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded border border-white/10 bg-[#0A1118]/60 px-3 py-2 text-sm text-slate-50 outline-none transition focus:border-emerald-600 focus:bg-[#0A1118]/90"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="font-orbitron w-full rounded border-2 border-emerald-600 bg-emerald-600 px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#0A1118] transition hover:bg-transparent hover:text-emerald-500 hover:shadow-[0_0_25px_rgba(5,150,105,0.5)] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-400 disabled:shadow-none"
              >
                {submitting ? "Submitting..." : "Submit Quote Request"}
              </button>
            </form>

            {status && (
              <div
                className={`rounded border p-3 text-xs font-medium ${
                  status.type === "success"
                    ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-500"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
