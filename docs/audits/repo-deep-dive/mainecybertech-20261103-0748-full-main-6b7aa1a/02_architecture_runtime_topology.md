# 02_architecture_runtime_topology — Prompt 02 - Architecture and Runtime Topology Audit

- Run: `mainecybertech-20261103-0748-full-main-6b7aa1a`
- Target: `mainecybertech` @ `6b7aa1a` (branch `main`)
- Domain: `02_architecture_runtime_topology.md` (area ARCH, prompt)

## Verification Performed

Read-only re-verification at 6b7aa1a5. 6/10 previous ARCH findings are verified fixed, 4 remain partially fixed (ARCH-P2-001, P2-002, P2-005, P3-001), 0 regressed. This diff adds host metrics (node-exporter plus disk/memory alerts) and refreshes the proxy last with an in-place caddy recreate; the single-droplet, single-Redis and service-role-default architecture is unchanged and remains owner-gated/accepted. One new P3: the new host-resource alerts have no `up{job="node-exporter"}` liveness rule, so losing the exporter silently removes the only host signal. Executed: promtool check rules against infra/digitalocean/prometheus.rules.yml (26 rules SUCCESS) and promtool test rules (SUCCESS); `docker compose -f infra/digitalocean/docker-compose.yml config` (exit 0); read compose/terraform/prometheus/deploy workflow and the architecture/ADR docs.

## Findings

| ID | Severity | Title |
|---|---|---|
| ARCH-P2-001 | P2 | Single-droplet, single-instance runtime is a hard SPOF |
| ARCH-P2-002 | P2 | API defaults to the service-role DB client (RLS bypass) |
| ARCH-P2-003 | P2 | Prometheus loads rules but has no alert routing |
| ARCH-P2-004 | P2 | API always enqueues to BullMQ while the worker backend is a separate setting with no parity check |
| ARCH-P2-005 | P2 | One non-replicated Redis backs queue, cache, idempotency and scan locks; failure degrades silently |
| ARCH-P3-001 | P3 | Web middleware gates routes on an unverified JWT `exp` |
| ARCH-P3-002 | P3 | Architecture diagram and ADR 004 contradict the as-built runtime |
| ARCH-P3-003 | P3 | `NEXT_PUBLIC_API_URL` runtime override is inert for server-side code; docs claim internal SSR routing |
| ARCH-P3-004 | P3 | Request timeout returns 408 but never cancels the handler |
| ARCH-P3-005 | P3 | Worker metrics/health are unauthenticated while the API gates /metrics |
| ARCH-P3-006 | P3 | Host-resource alerting has no liveness rule for the new node-exporter |
