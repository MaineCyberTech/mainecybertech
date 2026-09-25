"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export type VisualAssetActionResult = {
  ok: boolean;
  error?: string;
  id?: string;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function createVisualAssetAction(
  formData: FormData,
): Promise<VisualAssetActionResult> {
  try {
    await requireAdminAccess();

    const linkedEntityType = text(formData, "linkedEntityType");
    const linkedEntityId = text(formData, "linkedEntityId");
    const assetType = text(formData, "assetType");
    if (!linkedEntityType || !linkedEntityId || !assetType) {
      return { ok: false, error: "Entity type, entity id and asset type are required." };
    }

    const asset = await getApiClient().store.createVisualAsset({
      linkedEntityType,
      linkedEntityId,
      assetType,
      iconName: text(formData, "iconName"),
      accentColor: text(formData, "accentColor"),
      imageUrl: text(formData, "imageUrl"),
      altText: text(formData, "altText"),
      provenance: text(formData, "provenance"),
      licenseNotes: text(formData, "licenseNotes"),
    });

    revalidatePath("/admin/store/visuals");
    return { ok: true, id: asset.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}

export async function deleteVisualAssetAction(
  formData: FormData,
): Promise<VisualAssetActionResult> {
  try {
    await requireAdminAccess();
    const id = text(formData, "id");
    if (!id) return { ok: false, error: "Missing visual asset id." };

    await getApiClient().store.deleteVisualAsset(id);

    revalidatePath("/admin/store/visuals");
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unexpected error." };
  }
}
