import { pickCopyVariant } from "@/lib/catalog/copy-variants";
import type { CatalogProduct } from "@/lib/catalog/types";

interface TrustPanelProps {
  /** Product-specific inclusions/exclusions when available. */
  included?: string[];
  excluded?: string[];
  /** Stable seed for the copy variant (e.g. the product slug). */
  seed?: string;
}

const ITEMS = [
  {
    key: "included",
    title: "What is included",
    body: "Scope is written in plain English before work starts.",
  },
  {
    key: "no-secret",
    title: "No-secret intake",
    body: "Never send passwords, recovery codes, MFA seeds, or API keys. We coordinate safe access during onboarding.",
  },
  {
    key: "safe-access",
    title: "Safe-access process",
    body: "Time-boxed, least-privilege access that is closed out when the work is done.",
  },
  {
    key: "local",
    title: "Local Maine support",
    body: "You talk to the same people who do the work — no offshore call queue.",
  },
  {
    key: "exclusions",
    title: "Clear exclusions",
    body: "We tell you what is not included so there are no surprise bills.",
  },
] as const;

/** Prompt 17 trust panel: scope, access, support, and exclusions stated up front. */
export default function TrustPanel({ included, excluded, seed = "store" }: TrustPanelProps) {
  const intro = pickCopyVariant(
    "trust_panel_intro",
    seed,
    "The practical details: scope, access, support, and what we leave out.",
  );

  return (
    <section
      aria-labelledby="trust-panel-heading"
      className="rounded-lg border border-emerald-600/10 bg-[rgba(18,30,45,0.5)] p-6 backdrop-blur-sm sm:p-8"
    >
      <h2
        id="trust-panel-heading"
        className="font-display text-lg font-bold uppercase tracking-wider text-emerald-400"
      >
        How We Work
      </h2>
      <p className="mt-2 text-sm text-slate-400">{intro}</p>

      <ul className="mt-6 space-y-4">
        {ITEMS.map((item) => {
          let extra: string | undefined;
          if (item.key === "included" && included && included.length > 0) {
            extra = included.slice(0, 4).join(" · ");
          }
          if (item.key === "exclusions" && excluded && excluded.length > 0) {
            extra = excluded.slice(0, 4).join(" · ");
          }
          return (
            <li key={item.key} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-0.5 text-emerald-500">
                ▸
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-200">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-400">{item.body}</p>
                {extra && <p className="mt-1 text-xs text-slate-500">{extra}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Compact variant used on product pages, where the product already lists scope. */
export function TrustPanelFromProduct({ product }: { product: CatalogProduct }) {
  return (
    <TrustPanel
      included={product.whatIsIncluded}
      excluded={product.whatIsNotIncluded}
      seed={product.slug}
    />
  );
}
