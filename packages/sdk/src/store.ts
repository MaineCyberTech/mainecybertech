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
  categoryId: string;
  category: string;
  type: string;
  display: boolean;
  status: string;
  priceRange: string;
  summary: string;
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
};

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
}
