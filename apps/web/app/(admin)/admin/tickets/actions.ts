"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";

export async function createTicket(formData: FormData) {
  const api = getApiClient();

  const organizationId = String(formData.get("organizationId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal");
  const category = String(formData.get("category") ?? "").trim();

  if (!organizationId || !title) {
    throw new Error("Organization and title are required.");
  }

  await api.tickets.create({
    organizationId,
    title,
    description: description || null,
    priority,
    category: category || null,
    source: "admin",
  });

  revalidatePath("/admin/tickets");
}
