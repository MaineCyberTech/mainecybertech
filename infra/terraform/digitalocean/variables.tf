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
  description = "IP ranges allowed to SSH into the droplet. In production, restrict to office/VPN IPs."
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}

variable "cloudflare_ip_ranges" {
  description = "Cloudflare proxy IP ranges for HTTP(S) ingress. Used for HTTP/443 rules."
  type        = list(string)
  default     = [
    "173.245.48.0/20",
    "103.21.244.0/22",
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "190.93.240.0/20",
    "188.114.96.0/20",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "104.16.0.0/13",
    "104.24.0.0/14",
    "172.64.0.0/13",
    "131.0.72.0/22",
  ]
}