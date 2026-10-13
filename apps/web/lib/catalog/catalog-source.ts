import "server-only";
import { getApiClient } from "@/lib/api";
import { toCategoryView, toProductView } from "./store-view";
import {
  getAllProducts as getStaticProducts,
  getCategories as getStaticCategories,
  getActiveCampaigns as getStaticCampaigns,
} from "./loader";
import type { CatalogProduct, Category, SeasonalCampaign } from "./types";

export type CatalogSource = "db" | "static";

export interface CatalogSnapshot {
  products: CatalogProduct[];
  categories: Category[];
  source: CatalogSource;
}

async function fetchDbProducts(): Promise<CatalogProduct[] | null> {
  try {
    const products = await getApiClient().store.listProducts();
    if (!products || products.length === 0) return null;
    return products.map(toProductView);
  } catch {
    return null;
  }
}

async function fetchDbCategories(): Promise<Category[] | null> {
  try {
    const categories = await getApiClient().store.listCategories();
    if (!categories || categories.length === 0) return null;
    return categories.map(toCategoryView);
  } catch {
    return null;
  }
}

function withDerivedCounts(categories: Category[], products: CatalogProduct[]): Category[] {
  return categories.map((category) => ({
    ...category,
    count: products.filter((p) => p.categoryId === category.id).length,
  }));
}

/**
 * PERF-P2-002: short-TTL, per-process cache of the assembled catalog snapshot.
 *
 * Storefront routes render with `force-dynamic`, so without this every
 * layout + page (and generateMetadata) re-reads the catalog over the API. The
 * API itself response-caches the public catalog routes, so even a miss here
 * does not hit Supabase per view. Only DB-backed snapshots are cached — the
 * bundled-JSON fallback means the API failed or is empty, so the next request
 * retries instead of pinning the fallback for the TTL.
 */
const CATALOG_CACHE_TTL_MS = 60_000;

let catalogCache: { snapshot: CatalogSnapshot; expires: number } | null = null;

/** Test hook: drop the in-process catalog snapshot. */
export function invalidateCatalogCache(): void {
  catalogCache = null;
}

/**
 * Loads the store catalog from the DB-backed store API, falling back to the
 * bundled JSON when the API is unavailable or the tables are empty. This is what
 * makes admin catalog edits reach the public storefront.
 */
export async function loadCatalog(): Promise<CatalogSnapshot> {
  if (catalogCache && catalogCache.expires > Date.now()) {
    return catalogCache.snapshot;
  }

  const snapshot = await loadCatalogUncached();
  if (snapshot.source === "db") {
    catalogCache = { snapshot, expires: Date.now() + CATALOG_CACHE_TTL_MS };
  }
  return snapshot;
}

async function loadCatalogUncached(): Promise<CatalogSnapshot> {
  const [dbProducts, dbCategories] = await Promise.all([fetchDbProducts(), fetchDbCategories()]);

  if (dbProducts && dbCategories) {
    return {
      products: dbProducts,
      categories: withDerivedCounts(dbCategories, dbProducts),
      source: "db",
    };
  }

  const products = getStaticProducts();
  return {
    products,
    categories: withDerivedCounts(getStaticCategories(), products),
    source: "static",
  };
}

// --- Pure selectors over a snapshot (no I/O) ---

export function visibleProducts({ products }: CatalogSnapshot): CatalogProduct[] {
  return products.filter((p) => p.display === true);
}

export function productBySlug(
  { products }: CatalogSnapshot,
  slug: string,
): CatalogProduct | undefined {
  return products.find((p) => p.slug === slug);
}

export function productsInCategory(
  { products }: CatalogSnapshot,
  categoryId: string,
): CatalogProduct[] {
  return products.filter((p) => p.categoryId === categoryId);
}

export function categoryBySlug(
  { categories }: CatalogSnapshot,
  slug: string,
): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function featuredProducts(snapshot: CatalogSnapshot): CatalogProduct[] {
  return snapshot.products.filter((p) => p.tags.includes("quick-win") && p.display === true);
}

export function monthlyPlans(snapshot: CatalogSnapshot): CatalogProduct[] {
  return productsInCategory(snapshot, "monthly-it-plans");
}

export function emergencyProducts(snapshot: CatalogSnapshot): CatalogProduct[] {
  return productsInCategory(snapshot, "emergency-support");
}

/**
 * Active seasonal campaigns, DB-backed with the bundled JSON as fallback.
 * `capacityNotice` is computed server-side by the API and is only present when
 * the messaging is truthful (prompt 17 guardrail).
 */
export async function loadActiveCampaigns(): Promise<SeasonalCampaign[]> {
  try {
    const campaigns = await getApiClient().store.listActiveCampaigns();
    if (campaigns.length > 0) {
      return campaigns.map((campaign) => ({
        id: campaign.slug || campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        audience: campaign.audience,
        headline: campaign.headline,
        body: campaign.body,
        recommendedProducts: campaign.recommendedProductIds ?? [],
        trustBadges: campaign.trustBadges ?? [],
        promoEligibility: campaign.promoEligibility ?? [],
        visual: { icon: campaign.icon, accent: campaign.accent } as SeasonalCampaign["visual"],
        capacityNotice: campaign.capacityNotice ?? null,
      }));
    }
  } catch {
    // fall through to the bundled JSON
  }

  return getStaticCampaigns().map((campaign) => ({ ...campaign, capacityNotice: null }));
}
