import {
  createPromotion,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  getPromotions,
} from "@/lib/catalog/promotions";
import type { Promotion } from "@/lib/catalog/promotions";

export async function createPromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  const input = {
    name: form.get("name") as string,
    badgeText: (form.get("badgeText") as string) || "",
    detailText: (form.get("detailText") as string) || "",
    promoType: (form.get("promoType") as string) || "bundle_savings",
    status: (form.get("status") as Promotion["status"]) || "paused",
    terms: (form.get("terms") as string) || "",
    eligibilityTargets: ((form.get("eligibilityTargets") as string) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    startDate: (form.get("startDate") as string) || undefined,
    endDate: (form.get("endDate") as string) || undefined,
  };

  const validation = validatePromotion(input);
  if (!validation.valid) return { ok: false, error: validation.errors.join("; ") };

  const result = createPromotion({
    ...input,
    startDate: input.startDate || "",
    endDate: input.endDate || "",
  });
  if (!result.ok) return { ok: false, error: result.error };

  return { ok: true };
}

export async function updatePromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  const id = form.get("id") as string;
  if (!id) return { ok: false, error: "Missing id" };

  const existing = getPromotions().find((p) => p.id === id);
  if (!existing) return { ok: false, error: "Promotion not found" };

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

  const result = updatePromotion(id, patch);
  if (!result.ok) return { ok: false, error: result.error };

  return { ok: true };
}

export async function deletePromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  const id = form.get("id") as string;
  if (!id) return { ok: false, error: "Missing id" };
  deletePromotion(id);
  return { ok: true };
}
