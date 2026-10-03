"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export type ImportResult = {
  ok: boolean;
  error?: string;
  created?: number;
  updated?: number;
  failed?: string[];
};

function revalidateCatalog() {
  revalidatePath("/admin/store/import-export");
  revalidatePath("/admin/store/products");
  revalidatePath("/admin/store/categories");
  revalidatePath("/store");
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function boolFrom(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalised)) return true;
    if (["false", "0", "no", "off"].includes(normalised)) return false;
  }
  return fallback;
}

function listFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export async function importProductsAction(formData: FormData): Promise<ImportResult> {
  try {
    await requireAdminAccess();

    let parsed: unknown;
    try {
      parsed = JSON.parse(String(formData.get("payload") ?? "[]"));
    } catch {
      return { ok: false, error: "The uploaded file is not valid JSON." };
    }

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (rows.length === 0) return { ok: false, error: "No rows found in the file." };

    const api = getApiClient();
    let created = 0;
    let updated = 0;
    const failed: string[] = [];

    for (const raw of rows) {
      const row = (raw ?? {}) as Record<string, unknown>;
      const id = text(row.id);
      const slug = text(row.slug);
      const name = text(row.name);
      if (!id || !slug || !name) {
        failed.push(`${id ?? "row"}: id, slug and name are required`);
        continue;
      }

      const input = {
        id,
        slug,
        name,
        categoryId: text(row.categoryId) ?? null,
        category: text(row.category) ?? "",
        type: text(row.type) ?? "service",
        display: boolFrom(row.display, true),
        status: text(row.status) ?? "draft",
        priceRange: text(row.priceRange) ?? "",
        pricingModel: text(row.pricingModel) ?? "",
        purchaseMode: text(row.purchaseMode) ?? "",
        summary: text(row.summary) ?? "",
        marketingHeadline: text(row.marketingHeadline) ?? "",
        marketingCopy: text(row.marketingCopy) ?? "",
        tags: listFrom(row.tags),
        attributes:
          row.attributes && typeof row.attributes === "object"
            ? (row.attributes as Record<string, unknown>)
            : {},
      };

      try {
        const existing = await api.store.getProductById(id).catch(() => null);
        if (existing) {
          await api.store.updateProduct(id, input);
          updated += 1;
        } else {
          await api.store.createProduct(input);
          created += 1;
        }
      } catch (error) {
        failed.push(`${id}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    revalidateCatalog();
    return { ok: failed.length === 0, created, updated, failed };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function importCategoriesAction(formData: FormData): Promise<ImportResult> {
  try {
    await requireAdminAccess();

    let parsed: unknown;
    try {
      parsed = JSON.parse(String(formData.get("payload") ?? "[]"));
    } catch {
      return { ok: false, error: "The uploaded file is not valid JSON." };
    }

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (rows.length === 0) return { ok: false, error: "No rows found in the file." };

    const api = getApiClient();
    const existingCategories = await api.store.listCategories();
    const existingIds = new Set(existingCategories.map((c) => c.id));

    let created = 0;
    let updated = 0;
    const failed: string[] = [];

    for (const raw of rows) {
      const row = (raw ?? {}) as Record<string, unknown>;
      const id = text(row.id);
      const slug = text(row.slug);
      const name = text(row.name);
      if (!id || !slug || !name) {
        failed.push(`${id ?? "row"}: id, slug and name are required`);
        continue;
      }

      const input = {
        id,
        slug,
        name,
        description: text(row.description) ?? "",
        productIds: listFrom(row.productIds),
        count: typeof row.count === "number" ? row.count : 0,
      };

      try {
        if (existingIds.has(id)) {
          await api.store.updateCategory(id, input);
          updated += 1;
        } else {
          await api.store.createCategory(input);
          created += 1;
        }
      } catch (error) {
        failed.push(`${id}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    revalidateCatalog();
    return { ok: failed.length === 0, created, updated, failed };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
