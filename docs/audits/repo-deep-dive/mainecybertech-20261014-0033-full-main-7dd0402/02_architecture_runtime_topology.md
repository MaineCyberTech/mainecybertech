# 02_architecture_runtime_topology — Prompt 02 - Architecture and Runtime Topology Audit

- Run: `mainecybertech-20261014-0033-full-main-7dd0402`
- Target: `mainecybertech` @ `7dd0402` (branch `main`)
- Domain: `02_architecture_runtime_topology.md` (area ARCH, prompt)

## Verification Performed

Domain subagent produced 10 finding(s) at the bound commit; machine IDs assigned by tools/full_domain.py.

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
