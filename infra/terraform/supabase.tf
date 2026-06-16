#############################################
# Supabase project layer
#############################################

locals {
  supabase_project_name = var.environment == "prod" ? "mainecybertech-production" : "mainecybertech-${var.environment}"
  supabase_endpoint     = "https://${supabase_project.main_db.id}.supabase.co"
  supabase_db_host      = "db.${supabase_project.main_db.id}.supabase.co"
}

import {
  to = supabase_project.main_db
  id = "gigpuknitajakejmyxuk"
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

# Storage buckets are created manually via Supabase dashboard/CLI
# (supabase_storage_bucket resource not supported by provider v1.x)