import { ApiClient } from "./client";
import type { Notification, PaginatedResult } from "./types";

export interface NotificationPreference {
  id: string;
  organization_id?: string | null;
  module_key: string;
  channel: string;
  enabled: boolean;
  created_at: string;
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
  modules: string[];
  channels: string[];
}

export class NotificationsApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; unread?: boolean }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.unread) qp.unread = "true";
    return this.client.get<PaginatedResult<Notification>>("/api/v1/notifications", qp);
  }

  unreadCount() {
    return this.client.get<{ count: number }>("/api/v1/notifications/unread-count");
  }

  markRead(id: string) {
    return this.client.post<Notification>(`/api/v1/notifications/${id}/read`);
  }

  markAllRead() {
    return this.client.post<{ ok: boolean }>("/api/v1/notifications/mark-all-read");
  }

  create(data: {
    userId: string;
    title: string;
    body: string;
    module: string;
    moduleId?: string;
    action: string;
    organizationId?: string;
  }) {
    return this.client.post<Notification>("/api/v1/notifications", data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/notifications/${id}`);
  }

  listPreferences(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<NotificationPreferencesResponse>("/api/v1/notification-preferences", qp);
  }

  updatePreferences(data: {
    organizationId?: string;
    preferences: Array<{ moduleKey: string; channel: string; enabled: boolean }>;
  }) {
    return this.client.put<{ updated: number }>("/api/v1/notification-preferences", data);
  }
}
