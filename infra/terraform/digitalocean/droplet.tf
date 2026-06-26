resource "digitalocean_droplet" "portal" {
  name     = "mct-portal-${var.environment}"
  region   = var.droplet_region
  size     = var.droplet_size
  image    = var.droplet_image
  ssh_keys = [var.ssh_fingerprint]

  monitoring = true
  tags       = ["mct-portal", var.environment]

  user_data = templatefile("${path.module}/cloud-init.yml", {
    docker_compose_dir = var.docker_compose_dir
    environment        = var.environment
  })

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [user_data]
  }
}

resource "digitalocean_reserved_ip" "portal" {
  region      = var.droplet_region
  droplet_id  = digitalocean_droplet.portal.id
  description = "Reserved IP for mct-portal-${var.environment}"
}
