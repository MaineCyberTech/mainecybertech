import { ApiClient } from "./client";

export type StorePromotionStatus = "active" | "paused" | "expired" | "archived";

export interface StorePromotion {
  id: string;
  name: string;
  badge_text: string;
  detail_text: string;
  promo_type: string;
  status: StorePromotionStatus;
  terms: string;
  eligibility_targets: string[];
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateStorePromotionInput = {
  name: string;
  badgeText?: string;
  detailText?: string;
  promoType?: string;
  status?: StorePromotionStatus;
  terms?: string;
  eligibilityTargets?: string[];
  startDate?: string;
  endDate?: string;
};

export type UpdateStorePromotionInput = Partial<CreateStorePromotionInput>;

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  category: string;
  type: string;
  display: boolean;
  status: string;
  priceRange: string;
  summary: string;
  pricingModel?: string;
  purchaseMode?: string;
  marketingHeadline?: string;
  marketingCopy?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  productIds: string[];
  count: number;
  productCount?: number;
}

export type CreateStoreProductInput = {
  id?: string;
  slug: string;
  name: string;
  categoryId?: string | null;
  category?: string;
  type?: string;
  display?: boolean;
  status?: string;
  priceRange?: string;
  pricingModel?: string;
  purchaseMode?: string;
  summary?: string;
  marketingHeadline?: string;
  marketingCopy?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
};

export type UpdateStoreProductInput = Partial<CreateStoreProductInput>;

export type CreateStoreCategoryInput = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  productIds?: string[];
  count?: number;
};

export type UpdateStoreCategoryInput = Partial<CreateStoreCategoryInput>;

export interface StoreCategoryDetail extends StoreCategory {
  products: StoreProduct[];
}

export interface StoreQuoteItem {
  productId?: string;
  name?: string;
  priceRange?: string;
}

export interface StoreQuote {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string;
  items: StoreQuoteItem[];
  status: string;
  created_at: string;
  updated_at: string;
}

export type SubmitStoreQuoteInput = {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  items?: Array<string | StoreQuoteItem>;
  /** Optional lead-scoring signals. */
  userCount?: number;
  needsOnsite?: boolean;
  adminAccessAvailable?: boolean;
  requestedConsult?: boolean;
};

export interface StoreQuoteRequest {
  id: string;
  status: string;
  customer: Record<string, unknown>;
  items: unknown[];
  selected_promo_ids: string[];
  recommended_bundle_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StoreLeadBand = "low" | "medium" | "high" | "priority";

export interface StoreLeadScoreBreakdownEntry {
  rule: string;
  label: string;
  points: number;
}

export interface StoreLead {
  id: string;
  quote_request_id: string | null;
  status: string;
  lead_score: number;
  lead_band: StoreLeadBand;
  score_breakdown: StoreLeadScoreBreakdownEntry[];
  assigned_owner: string | null;
  follow_up_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StoreProposalDraftStatus =
  | "draft_internal"
  | "in_review"
  | "approved"
  | "sent"
  | "archived";

export interface StoreProposalDraft {
  id: string;
  quote_request_id: string | null;
  status: StoreProposalDraftStatus | string;
  sections: Record<string, unknown>;
  generated_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateStoreProposalDraftInput = {
  status?: StoreProposalDraftStatus;
  sections?: Record<string, string[]>;
};

export interface StoreVisualAsset {
  id: string;
  linkedEntityType: string;
  linkedEntityId: string;
  assetType: string;
  iconName: string;
  accentColor: string;
  imageUrl: string;
  altText: string;
  decorative: boolean;
  provenance: string;
  licenseNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateStoreVisualAssetInput = {
  linkedEntityType: string;
  linkedEntityId: string;
  assetType: string;
  iconName?: string;
  accentColor?: string;
  imageUrl?: string;
  altText?: string;
  decorative?: boolean;
  provenance?: string;
  licenseNotes?: string;
};

export type UpdateStoreVisualAssetInput = Partial<CreateStoreVisualAssetInput>;

export type ListStoreVisualAssetsParams = {
  linkedEntityType?: string;
  linkedEntityId?: string;
};

export type ConvertQuoteRequestInput = {
  organizationId: string;
  projectName?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  ownerId?: string | null;
  assignedOwnerId?: string | null;
};

export interface ConvertQuoteRequestResult {
  project: { id: string; name: string; status: string } & Record<string, unknown>;
  ticketId: string;
  checklistTaskCount: number;
}

export class StoreApi {
  constructor(private client: ApiClient) {}

  // --- Catalog (public) ---

  listProducts(params?: { category?: string }): Promise<StoreProduct[]> {
    return this.client.get<StoreProduct[]>("/api/v1/store/products", params);
  }

  getProduct(slug: string): Promise<StoreProduct> {
    return this.client.get<StoreProduct>(`/api/v1/store/products/${slug}`);
  }

  listCategories(): Promise<StoreCategory[]> {
    return this.client.get<StoreCategory[]>("/api/v1/store/categories");
  }

  getCategory(slug: string): Promise<StoreCategoryDetail> {
    return this.client.get<StoreCategoryDetail>(`/api/v1/store/categories/${slug}`);
  }

  // --- Products (public read / admin write) ---

  getProductById(id: string): Promise<StoreProduct> {
    return this.client.get<StoreProduct>(`/api/v1/store/products/by-id/${id}`);
  }

  createProduct(data: CreateStoreProductInput): Promise<StoreProduct> {
    return this.client.post<StoreProduct>("/api/v1/store/products", data);
  }

  updateProduct(id: string, data: UpdateStoreProductInput): Promise<StoreProduct> {
    return this.client.patch<StoreProduct>(`/api/v1/store/products/${id}`, data);
  }

  deleteProduct(id: string): Promise<void> {
    return this.client.delete(`/api/v1/store/products/${id}`);
  }

  // --- Categories (public read / admin write) ---

  createCategory(data: CreateStoreCategoryInput): Promise<StoreCategory> {
    return this.client.post<StoreCategory>("/api/v1/store/categories", data);
  }

  updateCategory(id: string, data: UpdateStoreCategoryInput): Promise<StoreCategory> {
    return this.client.patch<StoreCategory>(`/api/v1/store/categories/${id}`, data);
  }

  deleteCategory(id: string): Promise<void> {
    return this.client.delete(`/api/v1/store/categories/${id}`);
  }

  // --- Promotions (public read / admin write) ---

  listActivePromotions(): Promise<StorePromotion[]> {
    return this.client.get<StorePromotion[]>("/api/v1/store/promotions");
  }

  listPromotions(): Promise<StorePromotion[]> {
    return this.client.get<StorePromotion[]>("/api/v1/store/promotions/admin");
  }

  createPromotion(data: CreateStorePromotionInput): Promise<StorePromotion> {
    return this.client.post<StorePromotion>("/api/v1/store/promotions", data);
  }

  updatePromotion(id: string, data: UpdateStorePromotionInput): Promise<StorePromotion> {
    return this.client.patch<StorePromotion>(`/api/v1/store/promotions/${id}`, data);
  }

  deletePromotion(id: string): Promise<void> {
    return this.client.delete(`/api/v1/store/promotions/${id}`);
  }

  // --- Quotes (public submit / admin list) ---

  submitQuote(data: SubmitStoreQuoteInput): Promise<StoreQuote> {
    return this.client.post<StoreQuote>("/api/v1/store/quotes", data);
  }

  listQuotes(): Promise<StoreQuote[]> {
    return this.client.get<StoreQuote[]>("/api/v1/store/quotes");
  }

  // --- Quote requests + scored leads (admin) ---

  listQuoteRequests(): Promise<StoreQuoteRequest[]> {
    return this.client.get<StoreQuoteRequest[]>("/api/v1/store/quote-requests");
  }

  listLeads(): Promise<StoreLead[]> {
    return this.client.get<StoreLead[]>("/api/v1/store/leads");
  }

  // --- Proposal drafts (admin) ---

  generateProposalDraft(quoteRequestId: string): Promise<StoreProposalDraft> {
    return this.client.post<StoreProposalDraft>(
      `/api/v1/store/quote-requests/${quoteRequestId}/proposal`,
      {},
    );
  }

  listProposalDrafts(): Promise<StoreProposalDraft[]> {
    return this.client.get<StoreProposalDraft[]>("/api/v1/store/proposal-drafts");
  }

  updateProposalDraft(
    id: string,
    data: UpdateStoreProposalDraftInput,
  ): Promise<StoreProposalDraft> {
    return this.client.patch<StoreProposalDraft>(`/api/v1/store/proposal-drafts/${id}`, data);
  }

  // --- Visual assets (admin) ---

  listVisualAssets(params: ListStoreVisualAssetsParams = {}): Promise<StoreVisualAsset[]> {
    const searchParams = new URLSearchParams();
    if (params.linkedEntityType) searchParams.set("linkedEntityType", params.linkedEntityType);
    if (params.linkedEntityId) searchParams.set("linkedEntityId", params.linkedEntityId);
    const query = searchParams.toString();
    return this.client.get<StoreVisualAsset[]>(
      `/api/v1/store/visual-assets${query ? `?${query}` : ""}`,
    );
  }

  createVisualAsset(data: CreateStoreVisualAssetInput): Promise<StoreVisualAsset> {
    return this.client.post<StoreVisualAsset>("/api/v1/store/visual-assets", data);
  }

  updateVisualAsset(id: string, data: UpdateStoreVisualAssetInput): Promise<StoreVisualAsset> {
    return this.client.patch<StoreVisualAsset>(`/api/v1/store/visual-assets/${id}`, data);
  }

  deleteVisualAsset(id: string): Promise<void> {
    return this.client.delete(`/api/v1/store/visual-assets/${id}`);
  }

  // --- Intake -> project handoff (admin) ---

  convertQuoteRequest(
    id: string,
    data: ConvertQuoteRequestInput,
  ): Promise<ConvertQuoteRequestResult> {
    return this.client.post<ConvertQuoteRequestResult>(
      `/api/v1/store/quote-requests/${id}/convert`,
      data,
    );
  }
}
