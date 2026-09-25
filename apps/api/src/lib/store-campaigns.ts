/**
 * Store campaign mapping + the truthful-capacity rule (prompt 17).
 *
 * Ethical-FOMO guardrail: capacity messaging is only ever emitted when an admin
 * explicitly enabled it AND the stored numbers are internally consistent. The
 * server computes `capacityNotice`; the UI renders it verbatim (or nothing), so
 * there is no path to inventing scarcity client-side.
 */

export interface CampaignCapacityInput {
  capacity_enabled: boolean | null;
  capacity_total: number | null;
  capacity_remaining: number | null;
  capacity_label: string | null;
}

export interface CampaignWindowInput {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
}

export interface StoreCampaign {
  id: string;
  slug: string;
  name: string;
  audience: string;
  headline: string;
  body: string;
  icon: string;
  accent: string;
  recommendedProductIds: string[];
  trustBadges: string[];
  promoEligibility: string[];
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  capacityEnabled: boolean;
  capacityTotal: number | null;
  capacityRemaining: number | null;
  capacityLabel: string;
  /** Only present when the messaging is truthful; otherwise null. */
  capacityNotice: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRow extends CampaignCapacityInput, CampaignWindowInput {
  id: string;
  slug: string;
  name: string;
  audience: string;
  headline: string;
  body: string;
  icon: string;
  accent: string;
  recommended_product_ids: string[];
  trust_badges: string[];
  promo_eligibility: string[];
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export function isCampaignActive(campaign: CampaignWindowInput, now: Date = new Date()): boolean {
  if (campaign.status !== "active") return false;
  if (campaign.starts_at && new Date(campaign.starts_at) > now) return false;
  if (campaign.ends_at && new Date(campaign.ends_at) < now) return false;
  return true;
}

/**
 * Returns the capacity message to display, or null when it must not be shown.
 * Never fabricates a number and never implies scarcity that is not stored.
 */
export function capacityNotice(campaign: CampaignCapacityInput): string | null {
  if (!campaign.capacity_enabled) return null;

  const { capacity_total: total, capacity_remaining: remaining } = campaign;
  if (total === null || remaining === null) return null;
  if (total <= 0 || remaining <= 0) return null;
  if (remaining > total) return null;

  const label = campaign.capacity_label?.trim();
  return label ? label : `${remaining} of ${total} spots left`;
}

export function rowToCampaign(row: CampaignRow): StoreCampaign {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    audience: row.audience ?? "",
    headline: row.headline ?? "",
    body: row.body ?? "",
    icon: row.icon ?? "",
    accent: row.accent ?? "",
    recommendedProductIds: row.recommended_product_ids ?? [],
    trustBadges: row.trust_badges ?? [],
    promoEligibility: row.promo_eligibility ?? [],
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacityEnabled: row.capacity_enabled ?? false,
    capacityTotal: row.capacity_total,
    capacityRemaining: row.capacity_remaining,
    capacityLabel: row.capacity_label ?? "",
    capacityNotice: capacityNotice(row),
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
