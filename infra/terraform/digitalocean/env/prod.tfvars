# Production Terraform Variables
# Copy this file and fill in real values from your DigitalOcean/Cloudflare accounts
# NEVER commit real secrets to git - use GitHub Secrets for CI/CD

do_token              = "your-do-api-token"
ssh_fingerprint       = "your-ssh-key-fingerprint"
cloudflare_api_token  = "your-cloudflare-api-token"
cloudflare_zone_id    = "your-cloudflare-zone-id"
droplet_size          = "s-2vcpu-2gb"
environment           = "prod"