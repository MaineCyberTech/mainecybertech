/**
 * Server-side lead scoring for public store quote submissions.
 *
 * Mirrors the rule ids/points in `apps/web/lib/catalog/data/lead-scoring-rules.json`
 * (v5 sales-ops pack) so the public quote flow actually populates `store_leads`
 * instead of leaving the table unwired.
 */

export type LeadBand = "low" | "medium" | "high" | "priority";

export interface LeadScoringItem {
  productId?: string;
  name?: string;
  categoryId?: string;
}

export interface LeadScoringInput {
  items: Array<LeadScoringItem | string>;
  notes?: string;
  userCount?: number;
  needsOnsite?: boolean;
  adminAccessAvailable?: boolean;
  requestedConsult?: boolean;
}

export interface LeadScoreBreakdownEntry {
  rule: string;
  label: string;
  points: number;
}

export interface LeadScore {
  score: number;
  band: LeadBand;
  breakdown: LeadScoreBreakdownEntry[];
}

interface Rule {
  id: string;
  label: string;
  points: number;
}

export const LEAD_SCORE_BANDS: Array<{ id: LeadBand; min: number; max: number }> = [
  { id: "low", min: 0, max: 24 },
  { id: "medium", min: 25, max: 59 },
  { id: "high", min: 60, max: 84 },
  { id: "priority", min: 85, max: 100 },
];

const RULES: Rule[] = [
  { id: "emergency_selected", label: "Emergency service selected", points: 30 },
  { id: "monthly_plan_selected", label: "Monthly plan selected", points: 25 },
  { id: "cyber_insurance_selected", label: "Cyber insurance readiness selected", points: 20 },
  { id: "multiple_items", label: "Multiple products in quote", points: 15 },
  { id: "ten_plus_users", label: "10+ users indicated", points: 15 },
  { id: "admin_access_available", label: "Admin access available", points: 10 },
  { id: "onsite_network_camera", label: "Onsite/network/camera scope", points: 20 },
  { id: "asked_for_consult", label: "Requested consult", points: 10 },
];

function toItem(item: LeadScoringItem | string): LeadScoringItem {
  return typeof item === "string" ? { productId: item } : item;
}

function haystack(item: LeadScoringItem): string {
  return [item.productId, item.name, item.categoryId].filter(Boolean).join(" ").toLowerCase();
}

function anyItemIncludes(items: LeadScoringItem[], needles: string[]): boolean {
  return items.some((item) => needles.some((needle) => haystack(item).includes(needle)));
}

export function bandForScore(score: number): LeadBand {
  const band = LEAD_SCORE_BANDS.find((b) => score >= b.min && score <= b.max);
  return band?.id ?? "priority";
}

export function scoreLead(input: LeadScoringInput): LeadScore {
  const items = (input.items ?? []).map(toItem);
  const notes = (input.notes ?? "").toLowerCase();

  const matched: Record<string, boolean> = {
    emergency_selected: anyItemIncludes(items, ["emergency"]),
    monthly_plan_selected: anyItemIncludes(items, ["monthly-it-plans", "monthly plan", "monthly"]),
    cyber_insurance_selected: anyItemIncludes(items, ["insurance"]),
    multiple_items: items.length >= 2,
    ten_plus_users: (input.userCount ?? 0) >= 10,
    admin_access_available: input.adminAccessAvailable === true,
    onsite_network_camera:
      input.needsOnsite === true ||
      anyItemIncludes(items, ["onsite", "on-site", "network", "camera", "wi-fi", "wifi"]),
    asked_for_consult: input.requestedConsult === true || notes.includes("consult"),
  };

  const breakdown: LeadScoreBreakdownEntry[] = [];
  for (const rule of RULES) {
    if (matched[rule.id]) {
      breakdown.push({ rule: rule.id, label: rule.label, points: rule.points });
    }
  }

  const score = Math.min(
    100,
    breakdown.reduce((total, entry) => total + entry.points, 0),
  );

  return { score, band: bandForScore(score), breakdown };
}
