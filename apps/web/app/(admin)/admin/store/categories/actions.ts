"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function createCategoryAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const body = {
      name: (form.get("name") as string) || "",
      slug: (form.get("slug") as string) || "",
      description: (form.get("description") as string) || "",
      productIds: ((form.get("productIds") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    await getApiClient().store.createCategory(body);
    revalidatePath("/admin/store/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateCategoryAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    const patch: Record<string, unknown> = {};
    const name = form.get("name");
    if (name !== null) patch.name = name as string;
    const slug = form.get("slug");
    if (slug !== null) patch.slug = slug as string;
    const description = form.get("description");
    if (description !== null) patch.description = description as string;
    const productIds = form.get("productIds");
    if (productIds !== null) {
      patch.productIds = (productIds as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    await getApiClient().store.updateCategory(id, patch);
    revalidatePath("/admin/store/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCategoryAction(
  _prev: { ok: boolean; error?: string },
  form: FormData,
) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    await getApiClient().store.deleteCategory(id);
    revalidatePath("/admin/store/categories");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
