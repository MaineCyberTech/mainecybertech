variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "environment" {
  description = "Deployment environment (dev or prod)"
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}

variable "droplet_region" {
  description = "DigitalOcean region slug"
  type        = string
  default     = "nyc3"
}

variable "droplet_size" {
  description = "Droplet size slug"
  type        = string
  default     = "s-2vcpu-2gb"
}

variable "droplet_image" {
  description = "Droplet image slug"
  type        = string
  default     = "ubuntu-24-04-x64"
}

variable "ssh_fingerprint" {
  description = "SSH key fingerprint for root access"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for mainecybertech.com"
  type        = string
}

variable "cloudflare_zone_id_us" {
  description = "Cloudflare zone ID for mainecybertech.us"
  type        = string
  default     = ""
}

variable "domain_prod" {
  description = "Production domain"
  type        = string
  default     = "mainecybertech.com"
}

variable "domain_test" {
  description = "Testing domain"
  type        = string
  default     = "mainecybertech.us"
}

variable "docker_compose_dir" {
  description = "Path to docker-compose files on the droplet"
  type        = string
  default     = "/opt/mct-portal"
}

variable "admin_ip_ranges" {
  # WARNING: the default opens SSH to the entire internet. This is acceptable ONLY
  # because (a) SSH is key-only (no password auth), (b) the droplet runs no other
  # inbound services on 22, and (c) production terraform applies are gated by
  # prod-approval + validate/e2e/migrations in .github/workflows/terraform-do.yml.
  # For production, SET THIS to your office/VPN CIDRs (e.g. ["203.0.113.0/24"]) —
  # this restricts both the DigitalOcean firewall (firewall.tf) and the in-droplet
  # UFW rule (cloud-init.yml) since cloud-init renders per-CIDR `ufw allow from ...`
  # rules from this list. GitHub Actions egress IPs are dynamic, so the deploy
  # workflow cannot be pinned; key-only auth is the defense for CI deploys.
  description = "IP ranges allowed to SSH into the droplet. In production, restrict to office/VPN IPs. Default 0.0.0.0/0 is a convenience for CI deploys (GitHub Actions egress IPs are dynamic); key-only auth is enforced on the droplet."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}