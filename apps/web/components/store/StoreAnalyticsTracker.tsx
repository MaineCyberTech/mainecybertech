"use client";

import { useEffect } from "react";
import { track } from "@/lib/catalog/analytics";

interface StoreAnalyticsTrackerProps {
  /** Event name from the analytics registry (e.g. `product_detail_view`). */
  event: string;
  page: string;
  productId?: string;
  categoryId?: string;
}

/**
 * AN-P2-003: fires one storefront analytics event when a view mounts.
 * Renders nothing; the send is fire-and-forget and must never block the page.
 */
export default function StoreAnalyticsTracker({
  event,
  page,
  productId,
  categoryId,
}: StoreAnalyticsTrackerProps) {
  useEffect(() => {
    track(event, { page, productId, categoryId });
  }, [event, page, productId, categoryId]);

  return null;
}
