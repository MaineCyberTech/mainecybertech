output "droplet_ip" {
  description = "Public IPv4 of the portal droplet"
  value       = digitalocean_droplet.portal.ipv4_address
}

output "droplet_id" {
  description = "Droplet ID"
  value       = digitalocean_droplet.portal.id
}

output "droplet_urn" {
  description = "Droplet URN"
  value       = digitalocean_droplet.portal.urn
}
