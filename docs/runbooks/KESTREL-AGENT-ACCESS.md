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
