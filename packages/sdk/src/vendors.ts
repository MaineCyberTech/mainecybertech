import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";

export interface VendorContract {
  id: string;
  organization_id: string;
  vendor_name: string;
  service_name: string;
  contract_number: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  contract_value: number | null;
  auto_renews: boolean;
  status: string;
  contract_type: string;
  created_at: string;
}

export interface VendorContact {
  id: string;
  organization_id: string;
  vendor_name: string;
  contact_name: string | null;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  support_portal_url: string | null;
  account_number: string | null;
  is_primary: boolean;
}

export class VendorsApi {
  constructor(private client: ApiClient) {}

  contracts = {
    list: (params?: {
      page?: number;
      limit?: number;
      organizationId?: string;
      status?: string;
      search?: string;
    }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page) qp.page = params.page;
      if (params?.limit) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      if (params?.status) qp.status = params.status;
      if (params?.search) qp.search = params.search;
      return this.client.get<PaginatedResult<VendorContract>>(
        "/api/v1/vendors/vendor-contracts",
        qp,
      );
    },
    get: (id: string) => this.client.get<VendorContract>(`/api/v1/vendors/vendor-contracts/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post<VendorContract>("/api/v1/vendors/vendor-contracts", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch<VendorContract>(`/api/v1/vendors/vendor-contracts/${id}`, data),
    remove: (id: string) => this.client.delete<void>(`/api/v1/vendors/vendor-contracts/${id}`),
    renewals: (params?: { organizationId?: string }) => {
      const qp: Record<string, string | undefined> = {};
      if (params?.organizationId) qp.organization_id = params.organizationId;
      return this.client.get<{ items: VendorContract[]; total: number }>(
        "/api/v1/vendors/vendor-contracts/renewals",
        qp,
      );
    },
  };

  contacts = {
    list: (params?: {
      page?: number;
      limit?: number;
      organizationId?: string;
      search?: string;
    }) => {
      const qp: Record<string, string | number | undefined> = {};
      if (params?.page) qp.page = params.page;
      if (params?.limit) qp.limit = params.limit;
      if (params?.organizationId) qp.organization_id = params.organizationId;
      if (params?.search) qp.search = params.search;
      return this.client.get<PaginatedResult<VendorContact>>("/api/v1/vendors/vendor-contacts", qp);
    },
    get: (id: string) => this.client.get<VendorContact>(`/api/v1/vendors/vendor-contacts/${id}`),
    create: (data: Record<string, unknown>) =>
      this.client.post<VendorContact>("/api/v1/vendors/vendor-contacts", data),
    update: (id: string, data: Record<string, unknown>) =>
      this.client.patch<VendorContact>(`/api/v1/vendors/vendor-contacts/${id}`, data),
    remove: (id: string) => this.client.delete<void>(`/api/v1/vendors/vendor-contacts/${id}`),
  };
}
