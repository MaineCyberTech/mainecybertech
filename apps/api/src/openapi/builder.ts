export interface OpenApiPathItem {
  get?: OperationObject;
  post?: OperationObject;
  patch?: OperationObject;
  put?: OperationObject;
  delete?: OperationObject;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: Record<string, string[]>[] | null;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses: Record<string, ResponseObject>;
}

export interface ParameterObject {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  schema: { type: string; format?: string };
  description?: string;
}

export interface RequestBodyObject {
  required?: boolean;
  content: Record<string, { schema: Record<string, unknown> }>;
}

export interface ResponseObject {
  description: string;
  content?: Record<string, { schema: Record<string, unknown> }>;
}

export type OpenApiPaths = Record<string, OpenApiPathItem>;

export interface RouteDef {
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  summary: string;
  tag: string;
  auth?: boolean;
  params?: ParameterObject[];
  body?: Record<string, unknown>;
  responseDesc?: string;
  responseSchema?: Record<string, unknown>;
}

export function buildPaths(routes: RouteDef[]): OpenApiPaths {
  const paths: OpenApiPaths = {};
  for (const r of routes) {
    const op: OperationObject = {
      tags: [r.tag],
      summary: r.summary,
      responses: {
        "200": { description: r.responseDesc ?? "Success" },
        "400": { description: "Bad request" },
        "401": { description: "Unauthorized" },
        "403": { description: "Forbidden" },
        "500": { description: "Internal server error" },
      },
    };
    if (r.auth !== false) {
      op.security = [{ bearerAuth: [] }];
    } else {
      op.security = [];
    }
    if (r.params) op.parameters = r.params;
    if (r.body) {
      op.requestBody = {
        required: true,
        content: { "application/json": { schema: r.body } },
      };
    }
    if (r.responseSchema) {
      op.responses["200"] = {
        description: r.responseDesc ?? "Success",
        content: { "application/json": { schema: r.responseSchema } },
      };
    }
    const existing = paths[r.path] ?? {};
    existing[r.method] = op;
    paths[r.path] = existing;
  }
  return paths;
}

export function pathParam(name: string, description?: string): ParameterObject {
  return { name, in: "path", required: true, schema: { type: "string" }, description };
}

export function queryParam(name: string, description?: string): ParameterObject {
  return { name, in: "query", required: false, schema: { type: "string" }, description };
}
