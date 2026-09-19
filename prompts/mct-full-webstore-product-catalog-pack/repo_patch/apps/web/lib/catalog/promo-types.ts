export type PromotionType =
  | "bundle_savings"
  | "starter_credit"
  | "seasonal_offer"
  | "new_client_foundation"
  | "limited_capacity"
  | "free_addon";
export interface StorePromotion {
  id: string;
  type: PromotionType;
  label: string;
  status: "draft" | "active" | "paused" | "expired";
  productIds?: string[];
  categoryIds?: string[];
  badgeText: string;
  terms: string;
  startsAt?: string;
  endsAt?: string;
  requiresConsult?: boolean;
  adminNotes?: string;
}
export function isPromotionActive(promo: StorePromotion, now = new Date()) {
  if (promo.status !== "active") return false;
  if (promo.startsAt && now < new Date(promo.startsAt)) return false;
  if (promo.endsAt && now > new Date(promo.endsAt)) return false;
  return true;
}
