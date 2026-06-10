"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { requireAdminAccess } from "@/lib/auth/admin";

export async function updateTicketAction(ticketId: string, formData: FormData) {
  await requireAdminAccess();
  const api = getApiClient();
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priority = String(formData.get("priority") ?? "normal").trim();
  const status = String(formData.get("status") ?? "new").trim();
  if (!subject || !description)
    throw new Error("Title and description are required.");

  await api.tickets.update(ticketId, {
    title: subject,
    description,
    category: category || null,
    priority,
    status,
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  redirect(`/admin/tickets/${ticketId}`);
}

export async function addCommentAction(
  ticketId: string,
  organizationId: string,
  formData: FormData,
) {
  await requireAdminAccess();
  const api = getApiClient();
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = String(formData.get("isInternal") ?? "false") === "true";
  if (!body) throw new Error("Comment body is required.");

  await api.tickets.addComment(ticketId, {
    body,
    isInternal,
    organizationId,
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  redirect(`/admin/tickets/${ticketId}`);
}

export async function editCommentAction(
  ticketId: string,
  commentId: string,
  formData: FormData,
) {
  await requireAdminAccess();
  const api = getApiClient();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Comment body is required.");

  await api.tickets.updateComment(ticketId, commentId, { body });

  revalidatePath(`/admin/tickets/${ticketId}`);
}

export async function deleteTicketAction(ticketId: string, formData: FormData) {
  await requireAdminAccess();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (confirmation !== "DELETE") {
    throw new Error(
      "To delete this ticket, type DELETE in the confirmation box.",
    );
  }

  const api = getApiClient();
  await api.tickets.update(ticketId, { status: "closed" } as any);

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
  redirect(`/admin/tickets/${ticketId}`);
}

export async function inlineUpdateAction(ticketId: string, formData: FormData) {
  await requireAdminAccess();
  const api = getApiClient();
  const status = String(formData.get("status") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  const updates: Record<string, string> = {};
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (Object.keys(updates).length === 0) return;
  await api.tickets.update(ticketId, updates as any);
  revalidatePath(`/admin/tickets/${ticketId}`);
  redirect(`/admin/tickets/${ticketId}`);
}

export async function restoreTicketAction(ticketId: string) {
  await requireAdminAccess();
  const api = getApiClient();
  await api.tickets.update(ticketId, { status: "new" } as any);

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
  redirect(`/admin/tickets/${ticketId}`);
}
