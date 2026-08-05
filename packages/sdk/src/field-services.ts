import { ApiClient } from "./client";
import type { PaginatedResult } from "./types";
function qp(p?: Record<string, string | number | undefined>) {
  const r: Record<string, string | number | undefined> = {};
  if (p) for (const [k, v] of Object.entries(p)) if (v !== undefined) r[k] = v;
  return r;
}

export class FieldServicesApi {
  constructor(private c: ApiClient) {}
  isp = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/isp", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/isp/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/isp", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/isp/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/isp/${id}`),
  };
  unifi = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/unifi", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/unifi/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/unifi", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/unifi/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/unifi/${id}`),
  };
  portMaps = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/port-maps", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/port-maps/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/port-maps", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/port-maps/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/port-maps/${id}`),
  };
  camera = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/camera-calc", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/camera-calc/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/camera-calc", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/camera-calc/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/camera-calc/${id}`),
    calculate: (d: Record<string, unknown>) =>
      this.c.post<Record<string, unknown>>("/api/v1/field-services/camera-calc/calculate", d),
  };
  staging = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/staging", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/staging/${id}`),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/staging", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/staging/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/staging/${id}`),
  };
  networkDiagrams = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/network-diagrams", qp(p)),
    get: (id: string) => this.c.get<unknown>(`/api/v1/field-services/network-diagrams/${id}`),
    create: (d: Record<string, unknown>) =>
      this.c.post("/api/v1/field-services/network-diagrams", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/network-diagrams/${id}`, d),
    remove: (id: string) => this.c.delete(`/api/v1/field-services/network-diagrams/${id}`),
  };
}
