import type { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
import type {
  SatisfactionPulseRecord,
  Template,
  Schedule,
  ListSatisfactionPulseQuery,
  CreateSatisfactionPulseInput,
  UpdateSatisfactionPulseInput,
  RespondSatisfactionPulseInput,
  ExportSatisfactionPulseInput,
  TemplateInput,
  UpdateTemplateInput,
  ScheduleInput,
  UpdateScheduleInput,
} from "./satisfaction-pulse-widget";

export class SatisfactionPulseApi {
  constructor(private client: ApiClient) {}

  async list(params: ListSatisfactionPulseQuery = { page: 1, limit: 25 }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.source) searchParams.set("source", params.source);
    if (params.sourceEntityId) searchParams.set("sourceEntityId", params.sourceEntityId);
    searchParams.set("page", String(params.page ?? 1));
    searchParams.set("limit", String(params.limit ?? 25));

    const response = await this.client.get<PaginatedResult<SatisfactionPulseRecord>>(
      `/api/v1/satisfaction-pulse?${searchParams.toString()}`,
    );
    return response;
  }

  async get(id: string) {
    const response = await this.client.get<SatisfactionPulseRecord>(
      `/api/v1/satisfaction-pulse/${id}`,
    );
    return response;
  }

  async create(data: CreateSatisfactionPulseInput) {
    const response = await this.client.post<SatisfactionPulseRecord>(
      "/api/v1/satisfaction-pulse",
      data,
    );
    return response;
  }

  async update(id: string, data: UpdateSatisfactionPulseInput) {
    const response = await this.client.patch<SatisfactionPulseRecord>(
      `/api/v1/satisfaction-pulse/${id}`,
      data,
    );
    return response;
  }

  async remove(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(
      `/api/v1/satisfaction-pulse/${id}`,
    );
    return response;
  }

  async respond(id: string, data: RespondSatisfactionPulseInput) {
    const response = await this.client.post<SatisfactionPulseRecord>(
      `/api/v1/satisfaction-pulse/${id}/respond`,
      data,
    );
    return response;
  }

  async export(params: ExportSatisfactionPulseInput = { format: "csv" }) {
    const searchParams = new URLSearchParams();
    if (params.organizationId) searchParams.set("organizationId", params.organizationId);
    if (params.status) searchParams.set("status", params.status);
    if (params.source) searchParams.set("source", params.source);
    searchParams.set("format", params.format ?? "csv");

    // CSV is returned as a download, so this is a blob, not JSON. The route
    // is `/export` (there is no `/export.csv`).
    const response = await this.client.getBlob(
      `/api/v1/satisfaction-pulse/export?${searchParams.toString()}`,
    );
    return response;
  }

  async listTemplates(organizationId?: string) {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);

    const response = await this.client.get<Template[]>(
      `/api/v1/satisfaction-pulse/templates?${searchParams.toString()}`,
    );
    return response;
  }

  async getTemplate(id: string) {
    const response = await this.client.get<Template>(`/api/v1/satisfaction-pulse/templates/${id}`);
    return response;
  }

  async createTemplate(data: TemplateInput) {
    const response = await this.client.post<Template>("/api/v1/satisfaction-pulse/templates", data);
    return response;
  }

  async updateTemplate(id: string, data: UpdateTemplateInput) {
    const response = await this.client.patch<Template>(
      `/api/v1/satisfaction-pulse/templates/${id}`,
      data,
    );
    return response;
  }

  async listSchedules(organizationId?: string) {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);

    const response = await this.client.get<Schedule[]>(
      `/api/v1/satisfaction-pulse/schedules?${searchParams.toString()}`,
    );
    return response;
  }

  async getSchedule(id: string) {
    const response = await this.client.get<Schedule>(`/api/v1/satisfaction-pulse/schedules/${id}`);
    return response;
  }

  async createSchedule(data: ScheduleInput) {
    const response = await this.client.post<Schedule>("/api/v1/satisfaction-pulse/schedules", data);
    return response;
  }

  async updateSchedule(id: string, data: UpdateScheduleInput) {
    const response = await this.client.patch<Schedule>(
      `/api/v1/satisfaction-pulse/schedules/${id}`,
      data,
    );
    return response;
  }

  async removeSchedule(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(
      `/api/v1/satisfaction-pulse/schedules/${id}`,
    );
    return response;
  }
}

export function createSatisfactionPulseApi(client: ApiClient) {
  return new SatisfactionPulseApi(client);
}
