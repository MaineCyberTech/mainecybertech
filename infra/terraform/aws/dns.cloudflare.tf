#############################################
# Cloudflare DNS management
#
# These records manage the production and testing hostnames.
# App hostnames should use the exact Vercel-inspected targets.
# API hostnames should use the correct ALB/public API targets.
#############################################

resource "cloudflare_dns_record" "prod_app" {
  count   = var.cloudflare_zone_id_prod != "" && var.cloudflare_prod_app_target != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_prod
  name    = var.cloudflare_prod_app_name
  type    = "CNAME"
  content = var.cloudflare_prod_app_target
  ttl     = 1
  proxied = var.cloudflare_proxy_app_records
  comment = "Production app subdomain for Maine CyberTech"
}

resource "cloudflare_dns_record" "prod_api" {
  count   = var.cloudflare_zone_id_prod != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_prod
  name    = var.cloudflare_prod_api_name
  type    = "CNAME"
  content = aws_lb.api.dns_name
  ttl     = 1
  proxied = var.cloudflare_proxy_api_records
  comment = "Production API subdomain for Maine CyberTech"
}

resource "cloudflare_dns_record" "prod_www" {
  count   = var.cloudflare_zone_id_prod != "" && var.cloudflare_prod_www_target != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_prod
  name    = var.cloudflare_prod_www_name
  type    = "CNAME"
  content = var.cloudflare_prod_www_target
  ttl     = 1
  proxied = true
  comment = "Production www marketing subdomain for Maine CyberTech"
}

# Test/dev API record — points to the ALB DNS name
resource "cloudflare_dns_record" "test_api" {
  count   = var.cloudflare_zone_id_test != "" ? 1 : 0
  zone_id = var.cloudflare_zone_id_test
  name    = var.cloudflare_test_api_name
  type    = "CNAME"
  content = aws_lb.api.dns_name
  ttl     = 1
  proxied = var.cloudflare_proxy_api_records
  comment = "Test API subdomain for Maine CyberTech"
}
