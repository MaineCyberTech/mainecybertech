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
      `/satisfaction-pulse?${searchParams.toString()}`,
    );
    return response;
  }

  async get(id: string) {
    const response = await this.client.get<SatisfactionPulseRecord>(`/satisfaction-pulse/${id}`);
    return response;
  }

  async create(data: CreateSatisfactionPulseInput) {
    const response = await this.client.post<SatisfactionPulseRecord>("/satisfaction-pulse", data);
    return response;
  }

  async update(id: string, data: UpdateSatisfactionPulseInput) {
    const response = await this.client.patch<SatisfactionPulseRecord>(
      `/satisfaction-pulse/${id}`,
      data,
    );
    return response;
  }

  async remove(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(`/satisfaction-pulse/${id}`);
    return response;
  }

  async respond(id: string, data: RespondSatisfactionPulseInput) {
    const response = await this.client.post<SatisfactionPulseRecord>(
      `/satisfaction-pulse/${id}/respond`,
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

    const response = await this.client.get(
      `/satisfaction-pulse/export.csv?${searchParams.toString()}`,
    );
    return response;
  }

  async listTemplates(organizationId?: string) {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);

    const response = await this.client.get<Template[]>(
      `/satisfaction-pulse/templates?${searchParams.toString()}`,
    );
    return response;
  }

  async getTemplate(id: string) {
    const response = await this.client.get<Template>(`/satisfaction-pulse/templates/${id}`);
    return response;
  }

  async createTemplate(data: TemplateInput) {
    const response = await this.client.post<Template>("/satisfaction-pulse/templates", data);
    return response;
  }

  async updateTemplate(id: string, data: UpdateTemplateInput) {
    const response = await this.client.patch<Template>(`/satisfaction-pulse/templates/${id}`, data);
    return response;
  }

  async listSchedules(organizationId?: string) {
    const searchParams = new URLSearchParams();
    if (organizationId) searchParams.set("organizationId", organizationId);

    const response = await this.client.get<Schedule[]>(
      `/satisfaction-pulse/schedules?${searchParams.toString()}`,
    );
    return response;
  }

  async getSchedule(id: string) {
    const response = await this.client.get<Schedule>(`/satisfaction-pulse/schedules/${id}`);
    return response;
  }

  async createSchedule(data: ScheduleInput) {
    const response = await this.client.post<Schedule>("/satisfaction-pulse/schedules", data);
    return response;
  }

  async updateSchedule(id: string, data: UpdateScheduleInput) {
    const response = await this.client.patch<Schedule>(`/satisfaction-pulse/schedules/${id}`, data);
    return response;
  }

  async removeSchedule(id: string) {
    const response = await this.client.delete<{ deleted: boolean }>(
      `/satisfaction-pulse/schedules/${id}`,
    );
    return response;
  }
}

export function createSatisfactionPulseApi(client: ApiClient) {
  return new SatisfactionPulseApi(client);
}
