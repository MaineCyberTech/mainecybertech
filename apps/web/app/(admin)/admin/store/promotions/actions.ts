"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function authHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("mct_session")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function createPromotionAction(prev: { ok: boolean; error?: string }, form: FormData) {
  try {
    const body = {
      name: form.get("name") as string,
      badgeText: (form.get("badgeText") as string) || "",
      detailText: (form.get("detailText") as string) || "",
      promoType: (form.get("promoType") as string) || "bundle_savings",
      status: (form.get("status") as string) || "paused",
      terms: (form.get("terms") as string) || "",
      eligibilityTargets: ((form.get("eligibilityTargets") as string) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      startDate: (form.get("startDate") as string) || undefined,
      endDate: (form.get("endDate") as string) || undefined,
    };

    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/v1/store/promotions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json();
      return { ok: false, error: json.error?.message || "Failed to create promotion" };
    }
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

    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/v1/store/promotions/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const json = await res.json();
      return { ok: false, error: json.error?.message || "Failed to update promotion" };
    }
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

    const headers = await authHeaders();
    const res = await fetch(`${API_BASE}/api/v1/store/promotions/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const json = await res.json();
      return { ok: false, error: json.error?.message || "Failed to delete promotion" };
    }
    revalidatePath("/admin/store/promotions");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
