#############################################
# Supabase project layer
#############################################

locals {
  supabase_project_name = var.environment == "prod" ? "mainecybertech-production" : "mainecybertech-${var.environment}"
  supabase_endpoint      = "https://${supabase_project.main_db.id}.supabase.co"
  supabase_db_host       = "db.${supabase_project.main_db.id}.supabase.co"
}

resource "supabase_project" "main_db" {
  organization_id   = var.supabase_org_slug
  name              = local.supabase_project_name
  database_password = var.db_password
  region            = var.supabase_region

  lifecycle {
    prevent_destroy = true
  }
}

resource "supabase_storage_bucket" "documents" {
  project_ref = supabase_project.main_db.id
  name        = "documents"
  public      = false

  file_size_limit = 52428800
}

resource "supabase_storage_bucket" "avatars" {
  project_ref = supabase_project.main_db.id
  name        = "avatars"
  public      = true

  file_size_limit = 2097152
}