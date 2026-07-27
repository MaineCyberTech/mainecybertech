import type { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
import type {
  ClientOnboardingRecord,
  ChecklistItem,
  ListOnboardingQuery,
  CreateOnboardingInput,
  UpdateOnboardingInput,
  CompletePhaseInput,
  ExportOnboardingInput,
  UpdateChecklistItemInput,
} from "./client-onboarding-command-center";

export class ClientOnboardingApi {
  constructor(private client: ApiClient) {}

  async list(params: ListOnboardingQuery = { page: 1, limit: 25 }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.phase) searchParams.set("phase", params.phase);
    if (params.riskLevel) searchParams.set("riskLevel", params.riskLevel);
    if (params.onboardingLeadId) searchParams.set("onboardingLeadId", params.onboardingLeadId);
    searchParams.set("page", String(params.page ?? 1));
    searchParams.set("limit", String(params.limit ?? 25));

    const response = await this.client.get<PaginatedResult<ClientOnboardingRecord>>(
      `/client-onboarding?${searchParams.toString()}`,
    );
    return response;
  }

  async get(id: string) {
    const response = await this.client.get<ClientOnboardingRecord>(`/client-onboarding/${id}`);
    return response;
  }

  async create(data: CreateOnboardingInput) {
    const response = await this.client.post<ClientOnboardingRecord>("/client-onboarding", data);
    return response;
  }

  async update(id: string, data: UpdateOnboardingInput) {
    const response = await this.client.patch<ClientOnboardingRecord>(
      `/client-onboarding/${id}`,
      data,
    );
    return response;
  }

  async remove(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(`/client-onboarding/${id}`);
    return response;
  }

  async completePhase(id: string, data: CompletePhaseInput) {
    const response = await this.client.post<ClientOnboardingRecord>(
      `/client-onboarding/${id}/complete-phase`,
      data,
    );
    return response;
  }

  async export(params: ExportOnboardingInput = { format: "csv" }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.phase) searchParams.set("phase", params.phase);
    if (params.riskLevel) searchParams.set("riskLevel", params.riskLevel);
    searchParams.set("format", params.format ?? "csv");

    const response = await this.client.get(
      `/client-onboarding/export.csv?${searchParams.toString()}`,
    );
    return response;
  }

  async listChecklistItems(onboardingRecordId: string) {
    const response = await this.client.get<ChecklistItem[]>(
      `/client-onboarding/${onboardingRecordId}/checklist`,
    );
    return response;
  }

  async updateChecklistItem(
    onboardingRecordId: string,
    itemId: string,
    data: UpdateChecklistItemInput,
  ) {
    const response = await this.client.patch<ChecklistItem>(
      `/client-onboarding/${onboardingRecordId}/checklist/${itemId}`,
      data,
    );
    return response;
  }
}

export function createClientOnboardingApi(client: ApiClient) {
  return new ClientOnboardingApi(client);
}
