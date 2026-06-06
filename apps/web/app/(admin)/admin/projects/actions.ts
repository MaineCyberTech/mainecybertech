"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function createProject(formData: FormData) {
  const api = getApiClient();

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "planned").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const dueAt = String(formData.get("dueAt") ?? "").trim();

  if (!organizationId || !name) throw new Error("Organization and project name are required.");

  await api.projects.create({
    organizationId,
    name,
    description: description || null,
    status,
    priority,
    startsAt: startsAt || null,
    dueAt: dueAt || null,
  });

  revalidatePath("/admin/projects");
}
