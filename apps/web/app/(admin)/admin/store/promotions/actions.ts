"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function createPromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  try {
    const body = {
      name: form.get("name") as string,
      badgeText: (form.get("badgeText") as string) || "",
      detailText: (form.get("detailText") as string) || "",
      promoType: (form.get("promoType") as string) || "bundle_savings",
      status: (form.get("status") as "active" | "paused" | "expired" | "archived") || "paused",
      terms: (form.get("terms") as string) || "",
      eligibilityTargets: ((form.get("eligibilityTargets") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      startDate: (form.get("startDate") as string) || undefined,
      endDate: (form.get("endDate") as string) || undefined,
    };

    await getApiClient().store.createPromotion(body);
    revalidatePath("/admin/store/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updatePromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    const patch: Record<string, unknown> = {};
    for (const key of ["name", "badgeText", "detailText", "promoType", "status", "terms"] as const) {
      const v = form.get(key);
      if (v !== null) patch[key] = v as string;
    }
    const startDate = form.get("startDate") as string | null;
    const endDate = form.get("endDate") as string | null;
    if (startDate) patch.startDate = startDate;
    if (endDate) patch.endDate = endDate;
    const targets = form.get("eligibilityTargets") as string | null;
    if (targets !== null) {
      patch.eligibilityTargets = targets
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    await getApiClient().store.updatePromotion(id, patch);
    revalidatePath("/admin/store/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deletePromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  try {
    const id = form.get("id") as string;
    if (!id) return { ok: false, error: "Missing id" };

    await getApiClient().store.deletePromotion(id);
    revalidatePath("/admin/store/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
