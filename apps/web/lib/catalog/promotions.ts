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

let promotions: Promotion[] = [];
let nextId = 1;

export function getPromotions(): Promotion[] {
  return promotions;
}

export function getPromoRulesFromData(): PromoRules {
  return promoData as PromoRules;
}

export function getActivePromotions(): Promotion[] {
  return promotions.filter((p) => p.status === "active");
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

export function createPromotion(
  input: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
): { ok: true; data: Promotion } | { ok: false; error: string } {
  const validation = validatePromotion(input);
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const promo: Promotion = {
    id: String(nextId++),
    ...input,
    startDate: input.startDate || "",
    endDate: input.endDate || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  promotions.push(promo);
  return { ok: true, data: promo };
}

export function updatePromotion(
  id: string,
  input: Partial<Omit<Promotion, "id">>,
): { ok: true; data: Promotion } | { ok: false; error: string } {
  const idx = promotions.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { ok: false, error: "Promotion not found" };
  }

  const updated = { ...promotions[idx], ...input, updatedAt: new Date().toISOString() };
  const validation = validatePromotion({
    name: updated.name,
    badgeText: updated.badgeText,
    detailText: updated.detailText,
    promoType: updated.promoType,
    status: updated.status,
    terms: updated.terms,
    eligibilityTargets: updated.eligibilityTargets,
    startDate: updated.startDate,
    endDate: updated.endDate,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  promotions[idx] = updated;
  return { ok: true, data: updated };
}

export function deletePromotion(id: string): { ok: true } | { ok: false; error: string } {
  const idx = promotions.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { ok: false, error: "Promotion not found" };
  }
  promotions.splice(idx, 1);
  return { ok: true };
}

export function __resetPromotionsForTest(): void {
  promotions = [];
  nextId = 1;
}
