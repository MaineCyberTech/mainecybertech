import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface Invoice {
  id: string;
  organization_id: string;
  stripe_invoice_id?: string | null;
  invoice_number?: string | null;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  hosted_invoice_url?: string | null;
  invoice_pdf_url?: string | null;
  due_at?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_subscription_id?: string | null;
  plan_name: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id?: string | null;
  stripe_payment_intent_id?: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  paid_at?: string | null;
  created_at: string;
  invoices?: { invoice_number?: string | null; status?: string | null } | null;
}

export interface BillingCustomer {
  id: string;
  organization_id: string;
  stripe_customer_id?: string | null;
  billing_email?: string | null;
  default_payment_method?: string | null;
  created_at: string;
}

export interface BillingSummary {
  activeSubscriptions: number;
  overdueInvoices: number;
  paidInvoices: number;
  totalInvoices: number;
  recentInvoices: Invoice[];
}

export class BillingApi {
  constructor(private client: ApiClient) {}

  summary(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<BillingSummary>("/api/v1/billing/summary", qp);
  }

  listInvoices(params?: { page?: number; limit?: number; organizationId?: string; status?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    if (params?.status) qp.status = params.status;
    return this.client.get<PaginatedResult<Invoice>>("/api/v1/billing/invoices", qp);
  }

  getInvoice(id: string) {
    return this.client.get<Invoice>(`/api/v1/billing/invoices/${id}`);
  }

  listSubscriptions(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<Subscription[]>("/api/v1/billing/subscriptions", qp);
  }

  listPayments(params?: { page?: number; limit?: number; organizationId?: string }) {
    const qp: Record<string, string | number | undefined> = {};
    if (params?.page !== undefined) qp.page = params.page;
    if (params?.limit !== undefined) qp.limit = params.limit;
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<PaginatedResult<Payment>>("/api/v1/billing/payments", qp);
  }

  getBillingCustomer(params?: { organizationId?: string }) {
    const qp: Record<string, string | undefined> = {};
    if (params?.organizationId) qp.organization_id = params.organizationId;
    return this.client.get<BillingCustomer | null>("/api/v1/billing/billing-customer", qp);
  }

  syncFromStripe(data?: { organizationId?: string }) {
    return this.client.post<{ synced: number }>("/api/v1/billing/sync", data);
  }
}
