# Public API Routes

> **Generated** by `node scripts/public-route-inventory.mjs --write` from
> the `auth: false` RouteDefs in `apps/api/src/openapi/spec.ts`. Do not edit
> by hand; run the generator (CI runs `--check`) instead.
>
> Public means the OpenAPI operation is documented with `security: []`.
> Signature-verified webhook receivers and CAPTCHA-gated public forms carry
> no bearer-token auth but still verify a credential per request.

**33 public operations.**

## Analytics

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/analytics/csrf` | Bootstrap CSRF cookie for public analytics tracking |
| POST | `/analytics/track` | Track analytics event (public) |

## Auth

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/auth/callback` | Exchange auth code for session |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/sign-in` | Sign in with email/password (returns mfaRequired when a TOTP factor is enrolled) |
| POST | `/auth/sign-out` | Sign out |
| POST | `/auth/sign-up` | Create account |

## Batch

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/batch/status/public` | List public status items |

## Documents

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/documents/shares/{token}` | Get shared document by token (public) |

## FileRequests

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/file-requests/public/{token}` | Get public file request by token |

## Health

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/health/detail` | Detailed health check (internal; requires METRICS_TOKEN) |

## Public

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/public/csp-report` | Receive Content-Security-Policy violation reports |
| GET | `/public/init` | Public init (CSRF token) |
| POST | `/public/submit` | Public form submission |

## StatusPage

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/status-page/public/{orgId}` | Get public status page |

## Store

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/store/campaigns` | List active campaigns (public) |
| GET | `/store/categories` | List categories (public) |
| GET | `/store/categories/{slug}` | Get category with products (public) |
| GET | `/store/products` | List products (public) |
| GET | `/store/products/{slug}` | Get product by slug (public) |
| GET | `/store/promotions` | List promotions (public) |
| GET | `/store/promotions/active` | List active promotions (public) |
| POST | `/store/quotes` | Submit quote request |

## System

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/docs` | Swagger UI docs |
| GET | `/metrics` | Prometheus metrics |
| GET | `/openapi.json` | OpenAPI specification |

## Webhooks

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/webhooks/jira` | Jira webhook handler |
| POST | `/webhooks/jsm` | JSM webhook handler |
| GET | `/webhooks/m365` | M365 OAuth verification challenge |
| POST | `/webhooks/m365` | M365 webhook handler |
| POST | `/webhooks/stripe` | Stripe webhook handler |
