export type PromotionStatus = "draft" | "active" | "paused" | "expired" | "archived";
export type PromotionType =
  | "percentage_discount"
  | "fixed_credit"
  | "bundle_savings"
  | "included_addon"
  | "seasonal_campaign"
  | "new_client_intro"
  | "capacity_notice";

export interface StorePromotion {
  id: string;
  name: string;
  type: PromotionType;
  status: PromotionStatus;
  badgeText: string;
  detailText?: string;
  terms: string;
  startsAt?: string;
  endsAt?: string;
  eligibleProductIds?: string[];
  eligibleCategoryIds?: string[];
  eligibleBundleIds?: string[];
  requiresConsult?: boolean;
  stackable?: boolean;
  priority?: number;
}

export interface TrustBadge {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface QuoteLineItem {
  id: string;
  productId: string;
  lineItemType: "quick_win" | "bundle" | "monthly_plan" | "addon" | "custom_scope";
  quantity: number;
  notes?: string;
}

export interface QuoteRequest {
  id: string;
  customer: { name?: string; businessName?: string; email?: string; phone?: string };
  items: QuoteLineItem[];
  selectedPromoIds?: string[];
  recommendedBundleIds?: string[];
  notes?: string;
  status: "draft" | "submitted" | "reviewing" | "converted_to_project" | "closed";
}

export function isPromotionActive(promo: StorePromotion, now = new Date()) {
  if (promo.status !== "active") return false;
  if (promo.startsAt && now < new Date(promo.startsAt)) return false;
  if (promo.endsAt && now > new Date(promo.endsAt)) return false;
  return true;
}
