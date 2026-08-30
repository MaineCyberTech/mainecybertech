import { getAllProducts, getProductById, getBundleRules, getProductsByCategory } from "./loader";
import type { CatalogProduct } from "./types";

export function getRecommendationsForProduct(productId: string): CatalogProduct[] {
  const product = getProductById(productId);
  if (!product) return [];

  return product.recommendedUpsells
    .map((id) => getProductById(id))
    .filter((p): p is CatalogProduct => p !== undefined);
}

export function getRecommendationsForCategory(categoryName: string): CatalogProduct[] {
  const rules = getBundleRules();
  const matchingRule = rules.find(
    (r) => r.whenCategoryViewed.toLowerCase() === categoryName.toLowerCase(),
  );

  if (!matchingRule) return [];

  return matchingRule.recommend
    .map((id) => getProductById(id))
    .filter((p): p is CatalogProduct => p !== undefined);
}

export function getAllBundles(): CatalogProduct[] {
  const products = getAllProducts();
  const bundleIds = new Set<string>();

  for (const p of products) {
    if (p.categoryId === "business-starter-packs") {
      bundleIds.add(p.id);
    }
    if (p.tags.includes("bundle")) {
      bundleIds.add(p.id);
    }
    if (p.name.toLowerCase().includes("bundle")) {
      bundleIds.add(p.id);
    }
    if (p.id.endsWith("_bundle") || p.id.endsWith("_pack")) {
      bundleIds.add(p.id);
    }
  }

  return products.filter((p) => bundleIds.has(p.id));
}

export function getRecommendationType(
  productId: string,
): "addon" | "bundle" | "monthly_care" | "emergency" | "related" {
  const product = getProductById(productId);
  if (!product) return "related";

  if (product.categoryId === "business-starter-packs") return "bundle";
  if (product.categoryId === "monthly-it-plans") return "monthly_care";
  if (product.categoryId === "emergency-support") return "emergency";
  if (product.addOns && product.addOns.length > 0) return "addon";

  return "related";
}

export function getRelatedProducts(productId: string): CatalogProduct[] {
  const product = getProductById(productId);
  if (!product) return [];

  return getProductsByCategory(product.categoryId).filter(
    (p) => p.id !== productId && p.display === true,
  );
}
