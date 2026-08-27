import productsData from "../data/products.json";
import categoriesData from "../data/categories.json";
import { getSupabaseAdmin } from "../services/supabase";

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
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
  attributes: Record<string, unknown>;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  count: number;
}

const jsonProducts: CatalogProduct[] = (productsData as unknown as Array<Record<string, unknown>>).map(
  (p) => {
    const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
    const bool = (v: unknown, d = false): boolean => (typeof v === "boolean" ? v : d);
    const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
    const {
      id,
      slug,
      name,
      categoryId,
      category,
      type,
      display,
      status,
      priceRange,
      pricingModel,
      purchaseMode,
      summary,
      marketingHeadline,
      marketingCopy,
      tags,
      ...rest
    } = p;
    return {
      id: str(id),
      slug: str(slug),
      name: str(name),
      categoryId: typeof categoryId === "string" ? categoryId : null,
      category: str(category),
      type: str(type, "service"),
      display: bool(display, true),
      status: str(status, "draft"),
      priceRange: str(priceRange),
      pricingModel: str(pricingModel),
      purchaseMode: str(purchaseMode),
      summary: str(summary),
      marketingHeadline: str(marketingHeadline),
      marketingCopy: str(marketingCopy),
      tags: arr(tags),
      attributes: rest,
    };
  },
);

const jsonCategories: CatalogCategory[] = (categoriesData as unknown as Array<Record<string, unknown>>).map(
  (c) => {
    const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
    const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
    const num = (v: unknown, d = 0): number => (typeof v === "number" ? v : d);
    return {
      id: str(c.id),
      name: str(c.name),
      slug: str(c.slug),
      description: str(c.description),
      productIds: arr(c.productIds),
      count: num(c.count, arr(c.productIds).length),
    };
  },
);

function rowToProduct(row: Record<string, unknown>): CatalogProduct {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    categoryId: (row.category_id as string) ?? null,
    category: (row.category as string) ?? "",
    type: (row.type as string) ?? "service",
    display: (row.display as boolean) ?? true,
    status: (row.status as string) ?? "draft",
    priceRange: (row.price_range as string) ?? "",
    pricingModel: (row.pricing_model as string) ?? "",
    purchaseMode: (row.purchase_mode as string) ?? "",
    summary: (row.summary as string) ?? "",
    marketingHeadline: (row.marketing_headline as string) ?? "",
    marketingCopy: (row.marketing_copy as string) ?? "",
    tags: (row.tags as string[]) ?? [],
    attributes: (row.attributes as Record<string, unknown>) ?? {},
  };
}

function rowToCategory(row: Record<string, unknown>): CatalogCategory {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: (row.description as string) ?? "",
    productIds: (row.product_ids as string[]) ?? [],
    count: (row.count as number) ?? 0,
  };
}

/**
 * Read store products from the DB. Falls back to the static JSON catalog if
 * the tables are empty or unavailable (P2-22/23). DB is the source of truth
 * once seeded.
 */
export async function getProducts(): Promise<CatalogProduct[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .order("name", { ascending: true })
      .limit(1000);
    if (!error && data && data.length > 0) {
      return (data as unknown as Array<Record<string, unknown>>).map(rowToProduct);
    }
  } catch {
    // fall through to JSON
  }
  return jsonProducts;
}

export async function getCategories(): Promise<CatalogCategory[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_categories")
      .select("*")
      .order("name", { ascending: true })
      .limit(1000);
    if (!error && data && data.length > 0) {
      return (data as unknown as Array<Record<string, unknown>>).map(rowToCategory);
    }
  } catch {
    // fall through to JSON
  }
  return jsonCategories;
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return rowToProduct(data as unknown as Record<string, unknown>);
  } catch {
    // fall through
  }
  return jsonProducts.find((p) => p.slug === slug) ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<CatalogCategory | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("store_categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return rowToCategory(data as unknown as Record<string, unknown>);
  } catch {
    // fall through
  }
  return jsonCategories.find((c) => c.slug === slug) ?? null;
}

export async function getProductsByCategory(categoryId: string): Promise<CatalogProduct[]> {
  const all = await getProducts();
  return all.filter((p) => p.categoryId === categoryId);
}
