import type { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
import type {
  DynamicFormRecord,
  FormSubmission,
  ListDynamicFormsQuery,
  CreateDynamicFormInput,
  UpdateDynamicFormInput,
  SubmitDynamicFormInput,
  ExportDynamicFormsInput,
} from "./dynamic-client-forms-builder";

export class DynamicFormsApi {
  constructor(private client: ApiClient) {}

  async list(params: ListDynamicFormsQuery = { page: 1, limit: 25 }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.formType) searchParams.set("formType", params.formType);
    searchParams.set("page", String(params.page ?? 1));
    searchParams.set("limit", String(params.limit ?? 25));

    const response = await this.client.get<PaginatedResult<DynamicFormRecord>>(
      `/dynamic-forms?${searchParams.toString()}`,
    );
    return response;
  }

  async get(id: string) {
    const response = await this.client.get<DynamicFormRecord>(`/dynamic-forms/${id}`);
    return response;
  }

  async create(data: CreateDynamicFormInput) {
    const response = await this.client.post<DynamicFormRecord>("/dynamic-forms", data);
    return response;
  }

  async update(id: string, data: UpdateDynamicFormInput) {
    const response = await this.client.patch<DynamicFormRecord>(`/dynamic-forms/${id}`, data);
    return response;
  }

  async remove(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(`/dynamic-forms/${id}`);
    return response;
  }

  async publish(id: string, data?: { closesAt?: string | null }) {
    const response = await this.client.post<DynamicFormRecord>(
      `/dynamic-forms/${id}/publish`,
      data ?? {},
    );
    return response;
  }

  async submit(id: string, data: SubmitDynamicFormInput) {
    const response = await this.client.post<FormSubmission>(`/dynamic-forms/${id}/submit`, data);
    return response;
  }

  async listSubmissions(id: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const response = await this.client.get<PaginatedResult<FormSubmission>>(
      `/dynamic-forms/${id}/submissions?${searchParams.toString()}`,
    );
    return response;
  }

  async export(params: ExportDynamicFormsInput = { format: "csv" }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.formType) searchParams.set("formType", params.formType);
    searchParams.set("format", params.format ?? "csv");

    const response = await this.client.get(`/dynamic-forms/export.csv?${searchParams.toString()}`);
    return response;
  }
}

export function createDynamicFormsApi(client: ApiClient) {
  return new DynamicFormsApi(client);
}
