import productsData from "../data/products.json";
import categoriesData from "../data/categories.json";

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  category: string;
  type: string;
  display: boolean;
  status: string;
  priceRange: string;
  pricingModel: string;
  purchaseMode: string;
  summary: string;
  marketingHeadline: string;
  marketingCopy: string;
  tags: string[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  count: number;
}

const products: CatalogProduct[] = productsData as unknown as CatalogProduct[];
const categories: CatalogCategory[] = categoriesData as unknown as CatalogCategory[];

export function getProducts(): CatalogProduct[] {
  return products;
}

export function getCategories(): CatalogCategory[] {
  return categories;
}

export function getProductBySlug(slug: string): CatalogProduct | undefined {
  return products.find((p) => p.slug === slug);
}

export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categorySlug: string): CatalogProduct[] {
  return products.filter((p) => p.categoryId === categorySlug || p.category === categorySlug);
}
