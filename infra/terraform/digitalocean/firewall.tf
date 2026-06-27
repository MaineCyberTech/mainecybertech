data "cloudflare_ip_ranges" "ipv4" {}
data "cloudflare_ip_ranges" "ipv6" {}

resource "digitalocean_firewall" "web" {
  name        = "mct-portal-${var.environment}-http"
  droplet_ids = [digitalocean_droplet.portal.id]

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