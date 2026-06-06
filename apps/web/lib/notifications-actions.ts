"use server";

import { revalidatePath } from "next/cache";
import { getApiClient } from "./api";

const api = () => getApiClient();

export async function markNotificationRead(id: string) {
  try {
    await api().notifications.markRead(id);
  } catch {
    throw new Error("Failed to mark notification read");
  }
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead() {
  try {
    await api().notifications.markAllRead();
  } catch {
    throw new Error("Failed to mark all read");
  }
  revalidatePath("/", "layout");
}

export async function dismissNotification(id: string) {
  try {
    await api().notifications.remove(id);
  } catch {
    throw new Error("Failed to dismiss notification");
  }
  revalidatePath("/", "layout");
}

export async function getUnreadCount(): Promise<number> {
  try {
    const result = await api().notifications.unreadCount();
    return result.count;
  } catch {
    return 0;
  }
}

export async function getRecentNotifications() {
  try {
    const result = await api().notifications.list({ limit: 5, unread: true });
    return result.items;
  } catch {
    return [];
  }
}
