import { ApiClient } from "./client";

export type TrackAnalyticsEventInput = {
  event: string;
  page?: string;
  productId?: string;
  categoryId?: string;
  promoId?: string;
  quizId?: string;
  quoteId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
  anonymousId?: string;
};

export type AnalyticsEvent = {
  id: string;
  event: string;
  page: string | null;
  product_id: string | null;
  category_id: string | null;
  created_at: string;
  [key: string]: unknown;
};

export type AnalyticsSummary = {
  event: string;
  count: number;
};

export class AnalyticsApi {
  constructor(private client: ApiClient) {}

  /** Public (unauthenticated) storefront event tracking. */
  track(data: TrackAnalyticsEventInput) {
    return this.client.post("/api/v1/analytics/track", data);
  }

  /** Admin: most recent 500 events. */
  list() {
    return this.client.get("/api/v1/analytics");
  }

  /** Admin: aggregate event counts. */
  summary() {
    return this.client.get("/api/v1/analytics/summary");
  }
}
