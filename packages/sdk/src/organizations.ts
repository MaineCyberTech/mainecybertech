import { ApiClient } from "./client";
import type {
  Organization,
  OrganizationDomain,
  OrganizationDetail,
  OrganizationOnboardInput,
  OrganizationOnboardResult,
  PaginatedResult,
} from "./types";

export class OrganizationsApi {
  constructor(private client: ApiClient) {}

  list(params?: { page?: number; limit?: number; status?: string; ids?: string[] }) {
    const qp: Record<string, string | number | undefined> = {};
    qp.page = params?.page ?? 1;
    qp.limit = params?.limit ?? 25;
    if (params?.status) qp.status = params.status;
    if (params?.ids?.length) qp.ids = params.ids.join(",");
    return this.client.get<PaginatedResult<Organization>>("/api/v1/organizations", qp);
  }

  listAll() {
    return this.client.get<Organization[]>("/api/v1/admin/organizations");
  }

  get(id: string) {
    return this.client.get<Organization>(`/api/v1/organizations/${id}`);
  }

  getDetail(id: string) {
    return this.client.get<OrganizationDetail>(`/api/v1/organizations/${id}/detail`);
  }

  create(data: {
    name: string;
    slug: string;
    primaryDomain?: string | null;
    supportPlan?: string | null;
  }) {
    return this.client.post<Organization>("/api/v1/organizations", data);
  }

  onboard(data: OrganizationOnboardInput) {
    return this.client.post<OrganizationOnboardResult>(
      "/api/v1/organizations/onboard",
      data,
    );
  }

  update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      status?: string;
      primaryDomain?: string | null;
      supportPlan?: string | null;
      logoUrl?: string | null;
      brandColor?: string | null;
      accentColor?: string | null;
      customDomain?: string | null;
    },
  ) {
    return this.client.patch<Organization>(`/api/v1/organizations/${id}`, data);
  }

  remove(id: string) {
    return this.client.delete<void>(`/api/v1/organizations/${id}`);
  }

  listDomains(orgId: string) {
    return this.client.get<OrganizationDomain[]>(`/api/v1/organizations/${orgId}/domains`);
  }

  addDomain(orgId: string, data: { domain: string; autoApprove?: boolean }) {
    return this.client.post<OrganizationDomain>(`/api/v1/organizations/${orgId}/domains`, data);
  }

  updateDomain(orgId: string, domainId: string, data: { autoApprove: boolean }) {
    return this.client.patch<OrganizationDomain>(
      `/api/v1/organizations/${orgId}/domains/${domainId}`,
      data,
    );
  }

  removeDomain(orgId: string, domainId: string) {
    return this.client.delete<void>(`/api/v1/organizations/${orgId}/domains/${domainId}`);
  }

  uploadLogo(orgId: string, file: File | Blob) {
    const fd = new FormData();
    fd.append("logo", file);
    return this.client.postFormData<{ logoUrl: string }>(`/api/v1/organizations/${orgId}/logo`, fd);
  }
}
