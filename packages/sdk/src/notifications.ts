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

/** VAPID public key state; `enabled: false` when the server has no keys. */
export interface VapidPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
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

  /** VAPID public key for `pushManager.subscribe` (NOTIF-P2-001). */
  getVapidPublicKey() {
    return this.client.get<VapidPublicKeyResponse>("/api/v1/push-subscriptions/vapid-public-key");
  }

  /** Register a browser push subscription; the endpoint upserts per user. */
  subscribePush(data: {
    endpoint: string;
    keys: PushSubscriptionKeys;
    organizationId?: string;
  }) {
    return this.client.post<{ id: string; endpoint: string }>("/api/v1/push-subscriptions", data);
  }

  /** Soft-revoke a browser push subscription by endpoint. */
  unsubscribePush(data: { endpoint: string }) {
    return this.client.delete<{ revoked: number }>("/api/v1/push-subscriptions", data);
  }
}
