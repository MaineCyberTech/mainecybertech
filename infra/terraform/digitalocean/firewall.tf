data "cloudflare_ip_ranges" "ipv4" {}
data "cloudflare_ip_ranges" "ipv6" {}

resource "digitalocean_firewall" "web" {
  name        = "mct-portal-${var.environment}-${digitalocean_droplet.portal.id}"
  droplet_ids = [digitalocean_droplet.portal.id]

  # WARNING: SSH is open to admin_ip_ranges, which DEFAULTS to 0.0.0.0/0 + ::/0
  # (see variables.tf). Mitigations: (1) droplet SSH is key-only (ssh_keys =
  # [var.ssh_fingerprint] in droplet.tf, no password auth), (2) UFW on the droplet
  # mirrors this same allowlist via cloud-init.yml, (3) production terraform applies
  # are gated by prod-approval + validate/e2e/migrations gates in terraform-do.yml so
  # a malicious PR cannot silently change firewall rules.
  # RESTRICT ME: set admin_ip_ranges to your office/VPN CIDRs in prod.tfvars/dev.tfvars.
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = var.admin_ip_ranges
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = data.cloudflare_ip_ranges.ipv4.ipv4_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = data.cloudflare_ip_ranges.ipv4.ipv4_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = data.cloudflare_ip_ranges.ipv6.ipv6_cidrs
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = data.cloudflare_ip_ranges.ipv6.ipv6_cidrs
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}