"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function createFormAction(formData: FormData) {
  const api = getApiClient();
  const membership = await getApprovedMembership();
  if (!membership?.organization_id) {
    return { ok: false as const, error: "No approved organization membership found." };
  }
  try {
    let fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      options: string[];
      validation: Record<string, unknown>;
      placeholder: string | null;
      helpText: string | null;
      sortOrder: number;
    }> = [];
    try {
      const parsed = JSON.parse(String(formData.get("fields") || "[]")) as Array<{
        key?: unknown;
        label?: unknown;
        type?: unknown;
        required?: unknown;
        options?: unknown;
        validation?: unknown;
        placeholder?: unknown;
        helpText?: unknown;
        sortOrder?: unknown;
      }>;
      fields = parsed.map((f, i) => ({
        key: String(f.key ?? `field_${i}`),
        label: String(f.label ?? "Field"),
        type: String(f.type ?? "text"),
        required: Boolean(f.required ?? false),
        options: Array.isArray(f.options) ? f.options.map(String) : [],
        validation: (f.validation as Record<string, unknown>) ?? {},
        placeholder: f.placeholder != null ? String(f.placeholder) : null,
        helpText: f.helpText != null ? String(f.helpText) : null,
        sortOrder: Number(f.sortOrder ?? 0),
      }));
    } catch {
      return { ok: false as const, error: "Fields must be valid JSON." };
    }
    const created = await api.dynamicForms.create({
      organizationId: membership.organization_id,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || null,
      formType: String(formData.get("formType") || "intake"),
      fields,
      settings: {},
      closesAt: null,
    });
    revalidatePath("/portal/dynamic-client-forms-builder");
    redirect(`/portal/dynamic-client-forms-builder/${created.id}`);
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to create" };
  }
}

export async function submitFormAction(formId: string, formData: FormData) {
  const api = getApiClient();
  try {
    const answers: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("f_")) answers[key.slice(2)] = String(value);
    }
    const respondentEmail = String(formData.get("respondentEmail") || "");
    await api.dynamicForms.submit(formId, {
      respondentEmail: respondentEmail || null,
      answers,
    });
    revalidatePath(`/portal/dynamic-client-forms-builder/${formId}/fill`);
    return { ok: true as const };
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed to submit" };
  }
}
