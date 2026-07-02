import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";

export const register = new Registry();

collectDefaultMetrics({ register, prefix: "portal_" });

export const httpRequestsTotal = new Counter({
  name: "portal_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "portal_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: "portal_db_query_duration_seconds",
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const webhookDeliveriesTotal = new Counter({
  name: "portal_webhook_deliveries_total",
  help: "Total number of webhook deliveries",
  labelNames: ["status", "event"],
  registers: [register],
});

export const authAttemptsTotal = new Counter({
  name: "portal_auth_attempts_total",
  help: "Total number of authentication attempts",
  labelNames: ["result"],
  registers: [register],
});

export const organizationsCreatedTotal = new Counter({
  name: "portal_organizations_created_total",
  help: "Total number of organizations created",
  registers: [register],
});

export const projectsCreatedTotal = new Counter({
  name: "portal_projects_created_total",
  help: "Total number of projects created",
  registers: [register],
});

export const ticketsCreatedTotal = new Counter({
  name: "portal_tickets_created_total",
  help: "Total number of tickets created",
  registers: [register],
});

export const documentsCreatedTotal = new Counter({
  name: "portal_documents_created_total",
  help: "Total number of documents created",
  registers: [register],
});

export const searchQueriesTotal = new Counter({
  name: "portal_search_queries_total",
  help: "Total number of search queries executed",
  registers: [register],
});

export const activeOrganizations = new Gauge({
  name: "portal_active_organizations",
  help: "Current number of active organizations",
  registers: [register],
});

export const activeUsers = new Gauge({
  name: "portal_active_users",
  help: "Current number of active users",
  registers: [register],
});

export const circuitBreakerStatus = new Gauge({
  name: "portal_circuit_breaker_status",
  help: "Circuit breaker status (0=closed, 1=half-open, 2=open)",
  labelNames: ["name"],
  registers: [register],
});

export const idempotencyKeyHits = new Counter({
  name: "portal_idempotency_key_hits_total",
  help: "Total number of idempotent requests served from cache",
  registers: [register],
});

export function recordDbQuery(operation: string, table: string, durationSeconds: number) {
  dbQueryDuration.observe({ operation, table }, durationSeconds);
}

export function recordWebhookDelivery(status: "success" | "failed", event: string) {
  webhookDeliveriesTotal.inc({ status, event });
}

export function recordAuthAttempt(result: "success" | "failure") {
  authAttemptsTotal.inc({ result });
}

export function recordOrganizationCreated() {
  organizationsCreatedTotal.inc();
}

export function recordProjectCreated() {
  projectsCreatedTotal.inc();
}

export function recordTicketCreated() {
  ticketsCreatedTotal.inc();
}

export function recordDocumentCreated() {
  documentsCreatedTotal.inc();
}

export function recordSearchQuery() {
  searchQueriesTotal.inc();
}

export function setCircuitBreakerStatus(name: string, status: "closed" | "half-open" | "open") {
  const value = status === "closed" ? 0 : status === "half-open" ? 1 : 2;
  circuitBreakerStatus.set({ name }, value);
}

export function recordIdempotencyKeyHit() {
  idempotencyKeyHits.inc();
}

export function setActiveOrganizations(count: number) {
  activeOrganizations.set(count);
}

export function setActiveUsers(count: number) {
  activeUsers.set(count);
}
