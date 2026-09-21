import "server-only";
import { getApiClient } from "@/lib/api";
import { toCategoryView, toProductView } from "./store-view";
import {
  getAllProducts as getStaticProducts,
  getCategories as getStaticCategories,
} from "./loader";
import type { CatalogProduct, Category } from "./types";

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
 * Loads the store catalog from the DB-backed store API, falling back to the
 * bundled JSON when the API is unavailable or the tables are empty. This is what
 * makes admin catalog edits reach the public storefront.
 */
export async function loadCatalog(): Promise<CatalogSnapshot> {
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
