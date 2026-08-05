"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";

export async function generateQbrAction(formData: FormData) {
  const api = getApiClient();
  const organizationId = String(formData.get("organizationId") || "");
  try {
    const report = await api.qbr.generate({
      organizationId,
      title: String(formData.get("title") || "Quarterly Business Review"),
      periodStart: String(formData.get("periodStart") || "") || null,
      periodEnd: String(formData.get("periodEnd") || "") || null,
      visibility: String(formData.get("visibility") || "internal"),
    });
    revalidatePath("/admin/qbr");
    redirect(`/admin/qbr/${report.id}`);
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to generate" };
  }
}
