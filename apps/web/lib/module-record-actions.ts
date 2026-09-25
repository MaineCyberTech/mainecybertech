"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getModuleConfig } from "./module-config";

export async function updateModuleRecord(
  moduleKey: string,
  id: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const config = getModuleConfig(moduleKey);
  if (!config) return { ok: false, error: `Unknown module: ${moduleKey}` };

  try {
    const api = getApiClient();
    const resource = config.sdk(api);
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = formData.get(field.key);
      if (raw === null) continue;
      if (field.type === "checkbox") {
        payload[field.key] = raw === "on" || raw === "true";
      } else if (field.type === "number") {
        const n = Number(raw);
        payload[field.key] = Number.isNaN(n) ? null : n;
      } else {
        payload[field.key] = String(raw);
      }
    }
    await resource.update(id, payload);
    revalidatePath(config.listPath);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteModuleRecord(
  moduleKey: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const config = getModuleConfig(moduleKey);
  if (!config) return { ok: false, error: `Unknown module: ${moduleKey}` };

  try {
    const api = getApiClient();
    await config.sdk(api).remove(id);
    revalidatePath(config.listPath);
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}
