# Production Terraform Variables
# Copy this file and fill in real values from your DigitalOcean/Cloudflare accounts
# NEVER commit real secrets to git - use GitHub Secrets for CI/CD

do_token             = "your-do-api-token"
ssh_fingerprint      = "your-ssh-key-fingerprint"
cloudflare_api_token = "your-cloudflare-api-token"
cloudflare_zone_id   = "your-cloudflare-zone-id"
# REQUIRED: SSH allowlist (office/VPN CIDRs). No permissive default exists.
admin_ip_ranges      = ["203.0.113.0/24"]
droplet_size         = "s-2vcpu-2gb"
environment          = "prod"