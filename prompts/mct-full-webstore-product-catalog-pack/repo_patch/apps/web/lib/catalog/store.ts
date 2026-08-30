import productsData from "./products.json";
import categoriesData from "./categories.json";
import bundleRulesData from "./bundle-rules.json";
import type { StoreProduct, StoreCategory } from "./types";

export const products = productsData as StoreProduct[];
export const categories = categoriesData as StoreCategory[];
export const bundleRules = bundleRulesData;

export function getVisibleProducts() {
  return products.filter((p) => p.display);
}
export function getProductBySlug(slug: string) {
  return getVisibleProducts().find((p) => p.slug === slug);
}
export function getProductsByCategory(categoryId: string) {
  return getVisibleProducts().filter((p) => p.categoryId === categoryId);
}
export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}
export function getRecommendedProducts(product: StoreProduct) {
  const ids = new Set([...(product.recommendedUpsells ?? []), ...(product.addOns ?? [])]);
  return getVisibleProducts().filter((candidate) => ids.has(candidate.id));
}
export function validateCatalog() {
  const slugs = new Set<string>();
  for (const product of products) {
    if (!product.id || !product.slug || !product.name || !product.categoryId)
      throw new Error(`Invalid product: ${product.id}`);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
    slugs.add(product.slug);
  }
  return true;
}
