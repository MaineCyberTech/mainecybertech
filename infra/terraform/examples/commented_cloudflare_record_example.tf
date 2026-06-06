# Production app hostname in Cloudflare.
# Keep this record separate from the testing zone so production and testing cutovers remain independent.
# The content value should match the exact target returned by `vercel domains inspect app.mainecybertech.com`.
resource "cloudflare_dns_record" "prod_app" {
  zone_id = var.cloudflare_zone_id_prod
  name    = var.cloudflare_prod_app_name
  type    = "CNAME"
  content = var.cloudflare_prod_app_target

  # Automatic TTL is a reasonable baseline for proxied records.
  ttl     = 1

  # Proxy app traffic through Cloudflare by default.
  proxied = var.cloudflare_proxy_app_records
}
