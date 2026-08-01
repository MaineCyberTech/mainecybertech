# Troubleshooting

> Common issues, symptoms, and fixes. Last updated 2026-08-01.

## API

### API won't start — "Invalid environment variables"
The API validates env vars with a Zod schema (`apps/api/src/config/env.ts`) and crashes fast on missing/invalid values.
**Fix:** Copy `apps/api/.env.example` to `.env` (or `.env.local`) and fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` at minimum. The error message lists the exact failing fields.

### 500 errors on every request (or blank JSON errors)
Usually a missing `SUPABASE_URL`/keys pointing at an unreachable project, or `CORS_ORIGIN` not matching the browser origin.
**Fix:** Confirm the Supabase project is online and the URL/key pair in the API env is correct; verify `CORS_ORIGIN` includes the exact origin you are calling from.

## Web

### Blank page in production (or scripts blocked)
The nonce-based CSP (`apps/web/middleware.ts`) can block inline scripts if the nonce header is missing (e.g., when served behind a proxy that strips headers).
**Fix:** Confirm `x-nonce` is set by middleware and that external script hosts (Google Tag Manager, Tawk.to) are allowed; check the browser console for CSP violations and update the CSP header in `middleware.ts`.

### All API calls fail silently or go to the wrong host
`NEXT_PUBLIC_API_URL` is inlined at build time. Client components use the public URL; server components use `http://api:4000` inside Docker.
**Fix:** Pass `NEXT_PUBLIC_API_URL` as a build arg for Docker builds (see `apps/web/Dockerfile`) and set it in `.env.local` for local dev. `apps/web/lib/env.ts` now validates it and warns in dev when missing.

## Worker

### Worker keeps restarting (Redis connection refused)
BullMQ requires Redis at `REDIS_URL`. If the worker crashes immediately on boot, Redis is usually unreachable.
**Fix:** Verify `redis` is running (`docker compose up -d redis` or `docker ps`) and that `REDIS_URL` matches the compose service name (`redis://redis:6379`).

### Worker env error on boot
The worker validates env with `apps/worker/src/env.ts`. Missing `SUPABASE_URL`/`SUPABASE_ANON_KEY` (or an invalid `REDIS_URL`) throws at startup.
**Fix:** Copy `apps/worker/.env.example` and fill the required vars; run `pnpm --filter=worker dev` to see the exact Zod failure.

## Deploy & Infrastructure

### Deploy step "SSH to droplet" times out (deploy-do.yml)
The droplet may be under memory pressure or the SSH key/known-host changed.
**Fix:** Confirm the droplet is reachable (`ssh root@<ip>`) and the `DO_SSH_KEY` secret matches the droplet's authorized key. The workflow also prunes old images before loading new ones — if the disk is full, run `docker image prune -af` on the droplet manually.

### Supabase connection errors in API/Worker logs
Hosted Supabase can rate-limit or drop connections under burst traffic.
**Fix:** Check the Supabase project status page; verify the API keys are the project's current keys (rotate then update `SUPABASE_*` env vars and redeploy).

### Caddy TLS errors (certificate issuance)
Caddy needs port 80 open for ACME challenges and correct hostnames.
**Fix:** Ensure ports 80/443 are open in the DO firewall and the domain's A records point at the droplet (Cloudflare proxied is fine; DNS must resolve before TLS works).

### Docker containers OOM-killed (web)
The web container previously OOM'd at 128MB; compose now sets 256MB.
**Fix:** If it recurs, raise `mem_limit` for `web` in `infra/digitalocean/docker-compose.yml` and check `docker logs web` for memory errors.

## Auth & Sessions

### Redirect loop between /login and /portal/dashboard
The middleware treats a stale `mct_session` cookie as valid if it can't decode it.
**Fix:** Clear the `mct_session` cookie. Code-wise, the middleware decodes the JWT payload (base64url) and checks `exp` before trusting the cookie — see `apps/web/middleware.ts`.

### CSRF 403 errors on API calls
The API requires the `csrf_token` cookie (set by `GET /api/v1/public/init` or login) and a matching header for mutations.
**Fix:** Confirm the client sends the `x-csrf-token` header from the `csrf_token` cookie (the SDK does this automatically via `getCsrfToken`); check `apps/api/src/middleware/csrf.ts` for cookie/header name mismatches.

### "pending approval" bounce / can't reach login
Users authenticated but not approved are bounced to `/pending`; the page uses `logoutAction()` (clears the cookie) rather than a plain `/login` link to avoid the middleware bouncing them back.
**Fix:** If stuck, clear cookies or sign out from `/pending`.

## General

### `pnpm build` (web) fails on Windows with EPERM
Known symlink issue with Next.js `output: "standalone"` on Windows; `pnpm dev` works.
**Fix:** Build inside Docker/Linux or WSL; this does not affect CI or production builds.

### `pnpm test` fails with "Environment validation passed" errors
API/worker tests mock `getEnv()`; a failing env schema usually indicates a missing `JWT_SECRET` in the shell environment.
**Fix:** Ensure `apps/api/.env.local` (or exported vars) includes `JWT_SECRET` and the Supabase keys before running tests.
