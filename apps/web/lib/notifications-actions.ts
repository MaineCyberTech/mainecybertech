"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "./api";

const api = () => getApiClient();

export async function markNotificationRead(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api().notifications.markRead(id);
  } catch {
    return { ok: false, error: "Failed to mark notification read" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean; error?: string }> {
  try {
    await api().notifications.markAllRead();
  } catch {
    return { ok: false, error: "Failed to mark all read" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function dismissNotification(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api().notifications.remove(id);
  } catch {
    return { ok: false, error: "Failed to dismiss notification" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function getUnreadCount(): Promise<number> {
  return 0;
}

export async function getRecentNotifications() {
  try {
    const result = await api().notifications.list({ limit: 5, unread: true });
    return result.items;
  } catch {
    return [];
  }
}
