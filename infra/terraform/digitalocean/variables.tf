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
  # SSH is fail-closed: this variable has NO default, so every plan/apply must
  # supply an explicit allowlist. It restricts both the DigitalOcean firewall
  # (firewall.tf) and the in-droplet UFW rule (cloud-init.yml), since cloud-init
  # renders per-CIDR `ufw allow from ...` rules from this list.
  # Do NOT set this to 0.0.0.0/0 + ::/0 in production. Use your office/VPN
  # CIDRs, e.g. ["203.0.113.0/24", "2001:db8::/32"]. GitHub Actions egress IPs
  # are dynamic, so CI deploys cannot be pinned; key-only auth (ssh_keys in
  # droplet.tf, no password auth) is the remaining defense for CI access.
  description = "IP ranges allowed to SSH into the droplet (office/VPN CIDRs). Required; there is no default so SSH can never be silently opened to the whole internet."
  type        = list(string)

  validation {
    condition     = length(var.admin_ip_ranges) > 0
    error_message = "admin_ip_ranges must contain at least one CIDR; SSH cannot be fail-open."
  }
}