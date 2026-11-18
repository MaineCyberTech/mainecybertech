# Kestrel agent access on the portal droplets

Status: **live on `mct-portal-dev` (2026-11-16).** This runbook covers the
host-side Kestrel broker token, GitHub CLI wrapper and network path. It does
not put a broker token in the portal application, Docker images or CI.

## What the host has

| Item | Value |
|---|---|
| Host | `mct-portal-dev` (`138.197.105.82`), Ubuntu 24.04 |
| Broker URL | `http://192.168.222.225:8090` |
| Network path | WireGuard `wgaudit0`, route `192.168.222.0/24` |
| Consumer | `repo-mainecybertech` |
| Token file | `/etc/kestrel-agents/mainecybertech/broker-token` (`0600 root:root`) |
| GitHub CLI | `gh` 2.45+ |
| Wrappers | `/usr/local/bin/gh-kestrel`, `/usr/local/bin/git-credential-kestrel` |
| Helper | `/usr/local/libexec/kestrel-broker-github-token` (`0700 root`) |
| Shell env | `/etc/profile.d/kestrel-agent.sh` (non-secret paths only) |
| Git credential | global `credential.helper=/usr/local/bin/git-credential-kestrel` |

The token is a **Kestrel broker token**, not a GitHub PAT. `gh-kestrel` and
`git-credential-kestrel` exchange it for a short-lived, repository-scoped
GitHub App installation token. The broker token is scoped to
`MaineCyberTech/mainecybertech` with contents/issues/PR write and actions/checks
read. It does **not** grant `workflows: write`, administration or access to
another repository.

## Network requirement

The broker is internal-only. The droplet reaches it through the existing
`wgaudit0` WireGuard tunnel:

```sh
ping -c1 192.168.222.225
curl -fsS http://192.168.222.225:8090/v1/status
```

Current reachability from `mct-portal-dev` over the tunnel/public edge:

| Target | Result |
|---|---|
| `http://192.168.222.225:8090/v1/status` | 200 |
| `http://192.168.222.225:8080/healthz` | 200 |
| `https://psa.mainecybertech.us/api/readyz` | 200 |
| `https://access.mainecybertech.us/healthz` | 200 |
| `http://192.168.222.227:3000/api/readyz` | timeout; use the public PSA URL or add a firewall rule if direct access is required |

A `Connection reset` or timeout means the tunnel or route is down; fix that
before touching the token. Do not publish the broker through Cloudflare.

## Kestrel Identity SSO

The portal's Kestrel Identity login is the Supabase `custom:authelia` provider,
not a broker token. The droplet does not hold the OIDC client secret; Supabase
does. Verify the start route returns a Supabase authorize URL:

```sh
curl -sS -X POST https://api.mainecybertech.us/api/v1/auth/sso |
  jq -r 'if .success then "sso_start=ok" else "sso_start=failed" end'
```

Do not print or persist `cookieValue`; it is the PKCE verifier.

## Install or refresh the token

The token is managed by the Kestrel admin host `800g2`. Copy it root-to-root;
never print it, put it in a repository, container image, CI variable or chat.

```sh
# On 800g2, as root:
cat /etc/kestrel-agents/mainecybertech/broker-token |
  ssh root@138.197.105.82 '
    umask 077
    install -d -m 0700 -o root -g root /etc/kestrel-agents/mainecybertech
    cat > /etc/kestrel-agents/mainecybertech/broker-token
    chown root:root /etc/kestrel-agents/mainecybertech/broker-token
    chmod 0600 /etc/kestrel-agents/mainecybertech/broker-token
  '
```

The `repo-mainecybertech` consumer rotates quarterly on 800g2. The droplet copy
is not yet in the rotation script, so it must be refreshed after each rotation;
the previous token remains valid for the 24-hour grace window. Add the host to
the rotation automation before the next quarterly cycle.

## Install the wrappers

Copy the current wrappers and helper from the Kestrel admin host, preserving
modes:

```sh
tar -C / -cf - \
  usr/local/bin/gh-kestrel \
  usr/local/bin/git-credential-kestrel \
  usr/local/libexec/kestrel-broker-github-token |
  ssh root@138.197.105.82 'tar -C / -xf -'
```

Then on the droplet:

```sh
chmod 0755 /usr/local/bin/gh-kestrel /usr/local/bin/git-credential-kestrel
chmod 0700 /usr/local/libexec/kestrel-broker-github-token
git config --global credential.helper /usr/local/bin/git-credential-kestrel
```

`/etc/profile.d/kestrel-agent.sh` should contain only non-secret values:

```sh
export KESTREL_BROKER_URL="${KESTREL_BROKER_URL:-http://192.168.222.225:8090}"
export KESTREL_BROKER_TOKEN_FILE="${KESTREL_BROKER_TOKEN_FILE:-/etc/kestrel-agents/mainecybertech/broker-token}"
export KESTREL_AGENT_REPO="${KESTREL_AGENT_REPO:-mainecybertech}"
```

Systemd services do not read `/etc/profile.d`; set the same three variables in
the unit if a service needs broker access.

## Verify

```sh
bash -lc 'gh-kestrel api repos/MaineCyberTech/mainecybertech --jq .full_name'
bash -lc 'git ls-remote https://github.com/MaineCyberTech/mainecybertech.git HEAD'

# Write check without changing the remote
bash -lc 'git -C /opt/mct-portal/repo push --dry-run origin HEAD:refs/heads/kestrel-access-check'
```

Also run the repository checker:

```sh
./scripts/check-kestrel-agent.sh
```

Do not leave a real branch named `kestrel-access-check`; the dry run does not
create one.

## Portal secret check and repair

Kestrel owns the dev Supabase tokens in `/etc/kestrel/portal/portal.env`
(`0600 root:root`): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`. The file is written from Vault and is never
committed to the repository.

Check the droplet without changing it:

```sh
sudo ./scripts/kestrel-portal-secrets.sh check
```

Preview and apply the managed values:

```sh
sudo ./scripts/kestrel-portal-secrets.sh apply --dry-run
sudo ./scripts/kestrel-portal-secrets.sh apply
```

`check` validates the runtime service-role key against Supabase, compares the
managed keys with Kestrel's copy (short SHA-256 fingerprints only), and asserts
`/health/detail` reports a healthy database. `apply` validates the source key
before writing, backs up `.env`, merges only the managed keys, recreates
`api` and `worker`, and restores the backup if the post-apply check fails.
Neither mode prints a secret value.

The Kestrel **broker** token is not one of these keys; it must stay out of
`/opt/mct-portal/.env` (see "What not to do").

Until the GitHub `dev` environment secret is corrected, `deploy-do` rewrites
`.env` from that secret. Run `apply` after a deploy (or fix the secret) so the
droplet keeps the Kestrel-managed values.

## Workflow-scoped consumer (pending)

The default `repo-mainecybertech` consumer cannot push `.github/workflows/**`;
GitHub rejects the push with *"refusing to allow a GitHub App to create or
update workflow … without `workflows` permission."* Kestrel defines a separate
`repo-mainecybertech-workflows` consumer for reviewed workflow changes, but it
is **disabled** and its token is not installed on this droplet.

To enable reviewed workflow PRs from the agent:

1. Enable the `repo-mainecybertech-workflows` consumer in Kestrel and give it
   the GitHub App `workflows: write` permission.
2. Install its consumer token root-to-root on the droplet:
   `/etc/kestrel-agents/mainecybertech-workflows/broker-token` (`0600 root:root`).
3. Use it only for reviewed `.github/workflows/**` changes:
   `KESTREL_AGENT_REPO=mainecybertech-workflows gh-kestrel …`.
4. Keep the default `repo-mainecybertech` token for application code and PRs.

Until this is provisioned, workflow changes must be pushed by a human or applied
from a patch (for example `/root/sentry-dependency-review.patch` and
`/root/mct-deploy-safety.patch`).

## What not to do

- Do not copy the token into `/opt/mct-portal/.env`, Docker Compose or an app
  container.
- Do not use a GitHub PAT or the Kestrel admin token as a fallback.
- Do not grant `workflows: write` unless the task explicitly edits
  `.github/workflows` and the policy change is reviewed.
- Do not use the broker token for Cloudflare/DigitalOcean/PBS unless the
  consumer policy explicitly adds that alias.

## Related

- `MaineCyberTech/kestrel` `docs/runbooks/AGENT-GITHUB-ACCESS.md`
- `MaineCyberTech/kestrel` `docs/CONSUMER-ONBOARDING.md`
- `docs/PRODUCTION_VS_TESTING_DOMAINS.md`
- `infra/terraform/digitalocean/cloud-init.yml`
