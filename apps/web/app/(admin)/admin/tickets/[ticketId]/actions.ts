"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getApiClient } from "@/lib/api";
import { formErrorMessage } from "@/lib/api-error";
import { requireAdminAccess } from "@/lib/auth/admin";

export async function updateTicketAction(ticketId: string, formData: FormData) {
  try {
    await requireAdminAccess();
    const api = getApiClient();
    const subject = String(formData.get("subject") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const priority = String(formData.get("priority") ?? "normal").trim();
    const status = String(formData.get("status") ?? "new").trim();
    if (!subject || !description)
      return { ok: false as const, error: "Title and description are required." };

    // USE-P3-004: send If-Match with the version read moments before the write
    // so a concurrent admin edit is rejected with 409 instead of overwritten.
    const current = await api.tickets.get(ticketId);
    const ifMatch = current.version ?? (Number(formData.get("version")) || undefined);

    await api.tickets.update(ticketId, {
      title: subject,
      description,
      category: category || null,
      priority,
      status,
      ...(ifMatch !== undefined ? { ifMatch } : {}),
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    revalidatePath("/admin/tickets");
    redirect(`/admin/tickets/${ticketId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { ok: false as const, error: formErrorMessage(error) };
  }
}

export async function addCommentAction(
  ticketId: string,
  organizationId: string,
  formData: FormData,
) {
  try {
    await requireAdminAccess();
    const api = getApiClient();
    const body = String(formData.get("body") ?? "").trim();
    const isInternal = String(formData.get("isInternal") ?? "false") === "true";
    if (!body) return { ok: false as const, error: "Comment body is required." };

    await api.tickets.addComment(ticketId, {
      body,
      isInternal,
      organizationId,
    });

    revalidatePath(`/admin/tickets/${ticketId}`);
    redirect(`/admin/tickets/${ticketId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { ok: false as const, error: formErrorMessage(error) };
  }
}

export async function editCommentAction(ticketId: string, commentId: string, formData: FormData) {
  try {
    await requireAdminAccess();
    const api = getApiClient();
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return { ok: false as const, error: "Comment body is required." };

    await api.tickets.updateComment(ticketId, commentId, { body });

    revalidatePath(`/admin/tickets/${ticketId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: formErrorMessage(error) };
  }
}

export async function deleteTicketAction(ticketId: string, formData: FormData) {
  try {
    await requireAdminAccess();
    const confirmation = String(formData.get("confirmation") ?? "").trim();
    if (confirmation !== "DELETE") {
      return {
        ok: false as const,
        error: "To delete this ticket, type DELETE in the confirmation box.",
      };
    }

    // USE-P2-003: actually delete instead of quietly closing the ticket. The
    // product decision (DATA-P1-003) is hard delete; the soft-delete columns
    // were removed in migration 5302432, so the copy now says so honestly and
    // the unreachable Restore UI is gone. The SDK remove() sends the
    // { confirm: true } body the API requires (assertDeleteConfirmed).
    const api = getApiClient();
    await api.tickets.remove(ticketId);

    revalidatePath("/admin/tickets");
    revalidatePath("/admin");
    redirect("/admin/tickets");
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { ok: false as const, error: formErrorMessage(error) };
  }
}

export async function inlineUpdateAction(ticketId: string, formData: FormData) {
  try {
    await requireAdminAccess();
    const api = getApiClient();
    const status = String(formData.get("status") ?? "").trim();
    const priority = String(formData.get("priority") ?? "").trim();
    const updates: Record<string, string> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (Object.keys(updates).length === 0) return { ok: true as const };

    // USE-P3-004: If-Match so a concurrent edit surfaces as a 409 conflict
    // rather than being silently overwritten.
    const current = await api.tickets.get(ticketId);
    await api.tickets.update(ticketId, {
      ...updates,
      ...(current.version !== undefined ? { ifMatch: current.version } : {}),
    });
    revalidatePath(`/admin/tickets/${ticketId}`);
    redirect(`/admin/tickets/${ticketId}`);
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { ok: false as const, error: formErrorMessage(error) };
  }
}
