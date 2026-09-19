"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { getApprovedMembership } from "@/lib/auth/membership";

export async function addPortalProjectUpdate(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();
    if (!membership?.organization_id)
      return { ok: false as const, error: "No approved organization membership found." };

    const projectId = String(formData.get("projectId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!projectId || !body)
      return { ok: false as const, error: "Project ID and update body are required." };

    await api.projects.addUpdate(projectId, { body, isInternal: false, isPinned: false });
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function approvePortalProjectTask(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();
    if (!membership?.organization_id)
      return { ok: false as const, error: "No approved organization membership found." };

    const taskId = String(formData.get("taskId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    if (!taskId || !projectId)
      return { ok: false as const, error: "Project ID and task ID are required." };

    await api.projects.approveTask(projectId, taskId, {
      organizationId: membership.organization_id,
    });
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function addPortalTaskComment(formData: FormData) {
  try {
    const api = getApiClient();
    const membership = await getApprovedMembership();
    if (!membership?.organization_id)
      return { ok: false as const, error: "No approved organization membership found." };

    const taskId = String(formData.get("taskId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    if (!taskId || !projectId || !body)
      return { ok: false as const, error: "Project ID, task ID, and comment body are required." };

    await api.projects.addPortalTaskComment(projectId, taskId, {
      organizationId: membership.organization_id,
      body,
    });
    revalidatePath(`/portal/projects/${projectId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
