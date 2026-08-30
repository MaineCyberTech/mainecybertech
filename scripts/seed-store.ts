/**
 * Seed store catalog tables (P2-22/23).
 *
 * Reads apps/api/src/data/products.json + categories.json and upserts into
 * store_products / store_categories. Run with service-role credentials:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-store.ts
 *
 * The tables are created by migration 5302134; this populates them. Idempotent
 * (upsert by id). Run after the migration; safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productIds?: string[];
  count?: number;
}

interface RawProduct {
  id: string;
  slug: string;
  name: string;
  categoryId?: string;
  category?: string;
  type?: string;
  display?: boolean;
  status?: string;
  priceRange?: string;
  pricingModel?: string;
  purchaseMode?: string;
  summary?: string;
  marketingHeadline?: string;
  marketingCopy?: string;
  tags?: string[];
  [key: string]: unknown;
}

function main() {
  const root = resolve(__dirname, "..", "apps", "api", "src", "data");
  const categories: RawCategory[] = JSON.parse(
    readFileSync(resolve(root, "categories.json"), "utf8"),
  );
  const products: RawProduct[] = JSON.parse(readFileSync(resolve(root, "products.json"), "utf8"));

  return seed(categories, products);
}

async function seed(categories: RawCategory[], products: RawProduct[]) {
  // Categories
  const categoryRows = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    product_ids: c.productIds ?? [],
    count: c.count ?? (c.productIds ? c.productIds.length : 0),
  }));
  const { error: catErr } = await supabase
    .from("store_categories")
    .upsert(categoryRows, { onConflict: "id" });
  if (catErr) {
    console.error("Category upsert failed:", catErr.message);
    process.exit(1);
  }
  console.log(`Seeded ${categoryRows.length} categories`);

  // Products
  const productRows = products.map((p) => {
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
      id,
      slug,
      name,
      category_id: categoryId ?? null,
      category: category ?? "",
      type: type ?? "service",
      display: display ?? true,
      status: status ?? "draft",
      price_range: priceRange ?? "",
      pricing_model: pricingModel ?? "",
      purchase_mode: purchaseMode ?? "",
      summary: summary ?? "",
      marketing_headline: marketingHeadline ?? "",
      marketing_copy: marketingCopy ?? "",
      tags: tags ?? [],
      attributes: rest as Record<string, unknown>,
    };
  });

  // Upsert in batches to stay within Supabase payload limits.
  const BATCH = 50;
  for (let i = 0; i < productRows.length; i += BATCH) {
    const batch = productRows.slice(i, i + BATCH);
    const { error } = await supabase.from("store_products").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Product upsert failed at batch ${i}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`Seeded ${productRows.length} products`);
  console.log("Store catalog seeded successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
