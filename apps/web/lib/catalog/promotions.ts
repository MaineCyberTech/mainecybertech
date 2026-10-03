import promoData from "./data/promo-rules.json";
import type { PromoRules } from "./types";

export interface Promotion {
  id: string;
  name: string;
  badgeText: string;
  detailText: string;
  promoType: string;
  status: "active" | "paused" | "expired" | "archived";
  terms: string;
  eligibilityTargets: string[];
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function getPromoRulesFromData(): PromoRules {
  return promoData as PromoRules;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePromotion(
  p: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
): ValidationResult {
  const errors: string[] = [];

  if (!p.name?.trim()) {
    errors.push("Name is required");
  }
  if (!p.badgeText?.trim() && p.status === "active") {
    errors.push("Badge text is required for active status");
  }
  if (!p.terms?.trim() && p.status === "active") {
    errors.push("Terms are required for active status");
  }
  if ((!p.eligibilityTargets || p.eligibilityTargets.length === 0) && p.status === "active") {
    errors.push("At least one eligibility target is required for active status");
  }
  if (p.startDate && p.endDate && new Date(p.endDate) < new Date(p.startDate)) {
    errors.push("End date cannot be before start date");
  }

  return { valid: errors.length === 0, errors };
}
