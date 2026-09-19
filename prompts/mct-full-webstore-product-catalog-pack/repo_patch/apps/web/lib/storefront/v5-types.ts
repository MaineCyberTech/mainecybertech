export type LeadBand = "low" | "medium" | "high" | "priority";
export type LeadStatus =
  | "new"
  | "needs_review"
  | "high_priority"
  | "waiting_on_customer"
  | "quoted"
  | "converted"
  | "closed_lost";

export interface StoreAnalyticsEvent {
  event: string;
  anonymousId?: string;
  userId?: string;
  sessionId?: string;
  timestamp: string;
  path: string;
  referrer?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadScoreResult {
  leadId: string;
  score: number;
  band: LeadBand;
  status: LeadStatus;
  scoreBreakdown: Array<{ ruleId: string; label: string; points: number }>;
}

export interface ProductDependency {
  product: string;
  dependencyType: "requires" | "recommends" | "blocks_until_review" | "pairs_well_with";
  targetProducts: string[];
  severity?: "info" | "warning" | "blocking";
}
