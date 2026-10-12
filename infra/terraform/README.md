# Terraform Infrastructure

This directory contains Terraform configurations for the MCT portal infrastructure.

- `digitalocean/` - DigitalOcean infrastructure (active; the AWS root this
  directory once described was removed after the migration to DigitalOcean)

## Required variables

`admin_ip_ranges` (SSH allowlist) has **no default** — SSH is fail-closed. Every
plan/apply must supply it via a tfvars file (e.g. `["203.0.113.0/24"]`). The
`terraform-do` workflow reads it from the `ADMIN_IP_RANGES` GitHub secret and
aborts if it is unset or still contains `0.0.0.0/0` / `::/0`.

State locking uses the S3 backend's native `use_lockfile`, which requires
Terraform >= 1.10; the workflows and `scripts/install-terraform.ps1` pin 1.15.9
and `required_version` is `>= 1.15`.

## SSH allowlist changes (UFW drift, INFRA-P3-008)

`admin_ip_ranges` is enforced in two layers with different lifecycles:

- **DigitalOcean cloud firewall** (`firewall.tf`) — authoritative, re-applied on
  every `terraform apply`, so narrowed ranges take effect at the network edge
  immediately.
- **Droplet UFW** (`cloud-init.yml`) — seeded **once at first boot**; the
  droplet resource ignores `user_data` changes, so a later narrowing leaves the
  old `ufw allow from ...` rules in place (unreachable from outside because the
  cloud firewall blocks them, but stale defense-in-depth).

After narrowing `admin_ip_ranges` (and applying), refresh UFW on each droplet.
Run this over the DO console if your own address is being removed:

```sh
# On the droplet (root)
ufw status numbered          # review the stale rules first
ufw --force reset            # disables + clears all rules (SSH stays up)
ufw default deny incoming
ufw default allow outgoing
ufw allow 80/tcp
ufw allow 443/tcp
# Re-add every CIDR in the CURRENT admin_ip_ranges (no 0.0.0.0/0):
ufw allow from <cidr> to any port 22 proto tcp
ufw --force enable
ufw status verbose           # confirm only the current allowlist remains
```

Never open port 2376 (unauthenticated Docker daemon TCP); the cloud firewall
and UFW both keep it closed.

## State restore

The emergency state-restore procedure (versioned object copy + plan-only
verification) lives in `docs/ROLLBACK_PROCEDURES.md` §4 and is scripted in
`scripts/terraform-state-restore.sh` (`--list`, `--restore <VERSION_ID>`,
`--scratch`). The script is exercised by
`scripts/ci/test-terraform-state-restore.sh`; the live DO Spaces drill remains
an operator action recorded in `docs/PLATFORM_FAILURE_RUNBOOKS.md` §6.
