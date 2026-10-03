"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

function collectAttributes(form: FormData): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};

  const riskLevel = form.get("riskLevel");
  if (riskLevel !== null) attributes.riskLevel = riskLevel as string;

  const deliveryEffort = form.get("deliveryEffort");
  if (deliveryEffort !== null) attributes.deliveryEffort = deliveryEffort as string;

  if (form.get("bundleEligible") !== null) {
    attributes.bundleEligible = form.get("bundleEligible") === "true";
  }

  const raw = form.get("attributes");
  if (raw !== null && (raw as string).trim() !== "") {
    try {
      const parsed = JSON.parse(raw as string);
      if (parsed && typeof parsed === "object") {
        Object.assign(attributes, parsed);
      }
    } catch {
      // Ignore malformed JSON; top-level attribute fields are still applied.
    }
  }

  return attributes;
}

export async function createProductAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const tags = ((form.get("tags") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      slug: (form.get("slug") as string) || "",
      name: (form.get("name") as string) || "",
      categoryId: (form.get("categoryId") as string) || null,
      category: (form.get("category") as string) || "",
      type: (form.get("type") as string) || "service",
      status: (form.get("status") as string) || "draft",
      priceRange: (form.get("priceRange") as string) || "",
      pricingModel: (form.get("pricingModel") as string) || "",
      purchaseMode: (form.get("purchaseMode") as string) || "",
      display: form.get("display") === "true",
      summary: (form.get("summary") as string) || "",
      marketingHeadline: (form.get("marketingHeadline") as string) || "",
      marketingCopy: (form.get("marketingCopy") as string) || "",
      tags,
      attributes: collectAttributes(form),
    };

    await getApiClient().store.createProduct(body);
    revalidatePath("/admin/store/products");
    revalidatePath(`/admin/store/products/${(body as { slug: string }).slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateProductAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    const patch: Record<string, unknown> = {};
    const simpleFields = [
      "slug",
      "name",
      "categoryId",
      "category",
      "type",
      "status",
      "priceRange",
      "pricingModel",
      "purchaseMode",
      "summary",
      "marketingHeadline",
      "marketingCopy",
    ] as const;
    for (const key of simpleFields) {
      const v = form.get(key);
      if (v !== null) patch[key] = v as string;
    }
    const tags = form.get("tags");
    if (tags !== null) {
      patch.tags = (tags as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (form.get("display") !== null) patch.display = form.get("display") === "true";
    patch.attributes = collectAttributes(form);

    await getApiClient().store.updateProduct(id, patch);
    revalidatePath("/admin/store/products");
    revalidatePath(`/admin/store/products/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteProductAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    await getApiClient().store.deleteProduct(id);
    revalidatePath("/admin/store/products");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
