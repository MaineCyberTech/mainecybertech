# Production DNS — mainecybertech.com (only in prod environment)
resource "cloudflare_dns_record" "prod_www" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "prod_app" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "app"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "prod_api" {
  count   = var.environment == "prod" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}

# Dev/Testing DNS — mainecybertech.us
resource "cloudflare_dns_record" "test_www" {
  count   = var.environment == "dev" && var.cloudflare_zone_id_us != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_us
  name    = "www"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "test_app" {
  count   = var.environment == "dev" && var.cloudflare_zone_id_us != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_us
  name    = "app"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "test_api" {
  count   = var.environment == "dev" && var.cloudflare_zone_id_us != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_us
  name    = "api"
  type    = "A"
  content = digitalocean_droplet.portal.ipv4_address
  ttl     = 1
  proxied = true
}