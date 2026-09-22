"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";
import type { StoreCampaignStatus } from "@mct/sdk";

export type CampaignActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

const STATUSES: StoreCampaignStatus[] = ["draft", "active", "paused", "archived"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

function list(formData: FormData, key: string): string[] {
  return text(formData, key)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function status(formData: FormData): StoreCampaignStatus {
  const raw = text(formData, "status") as StoreCampaignStatus;
  return STATUSES.includes(raw) ? raw : "draft";
}

function revalidateCampaigns() {
  revalidatePath("/admin/store/campaigns");
  revalidatePath("/store");
  revalidatePath("/portal/store");
}

export async function createCampaignAction(formData: FormData): Promise<CampaignActionResult> {
  try {
    await requireAdminAccess();

    const slug = text(formData, "slug");
    const name = text(formData, "name");
    if (!slug || !name) return { ok: false, error: "Slug and name are required." };

    const capacityEnabled = text(formData, "capacityEnabled") !== "";
    const capacityTotal = num(formData, "capacityTotal");
    if (capacityEnabled && capacityTotal === null) {
      return { ok: false, error: "A capacity total is required to enable capacity messaging." };
    }

    const campaign = await getApiClient().store.createCampaign({
      slug,
      name,
      audience: text(formData, "audience"),
      headline: text(formData, "headline"),
      body: text(formData, "body"),
      icon: text(formData, "icon"),
      accent: text(formData, "accent"),
      recommendedProductIds: list(formData, "recommendedProductIds"),
      trustBadges: list(formData, "trustBadges"),
      promoEligibility: list(formData, "promoEligibility"),
      status: status(formData),
      capacityEnabled,
      capacityTotal,
      capacityRemaining: num(formData, "capacityRemaining"),
      capacityLabel: text(formData, "capacityLabel"),
    });

    revalidateCampaigns();
    return { ok: true, id: campaign.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function updateCampaignStatusAction(
  formData: FormData,
): Promise<CampaignActionResult> {
  try {
    await requireAdminAccess();
    const id = text(formData, "id");
    if (!id) return { ok: false, error: "Missing campaign id." };

    await getApiClient().store.updateCampaign(id, { status: status(formData) });

    revalidateCampaigns();
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function deleteCampaignAction(formData: FormData): Promise<CampaignActionResult> {
  try {
    await requireAdminAccess();
    const id = text(formData, "id");
    if (!id) return { ok: false, error: "Missing campaign id." };

    await getApiClient().store.deleteCampaign(id);

    revalidateCampaigns();
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
