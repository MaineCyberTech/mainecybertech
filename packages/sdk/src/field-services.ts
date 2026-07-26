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
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/isp", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/isp/${id}`, d),
  };
  unifi = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/unifi", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/unifi", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/unifi/${id}`, d),
  };
  portMaps = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/port-maps", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/port-maps", d),
  };
  camera = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/camera-calc", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/camera-calc", d),
  };
  staging = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/staging", qp(p)),
    create: (d: Record<string, unknown>) => this.c.post("/api/v1/field-services/staging", d),
    update: (id: string, d: Record<string, unknown>) =>
      this.c.patch(`/api/v1/field-services/staging/${id}`, d),
  };
  networkDiagrams = {
    list: (p?: Record<string, string | number | undefined>) =>
      this.c.get<PaginatedResult<unknown>>("/api/v1/field-services/network-diagrams", qp(p)),
    create: (d: Record<string, unknown>) =>
      this.c.post("/api/v1/field-services/network-diagrams", d),
  };
}
