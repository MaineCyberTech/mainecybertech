#############################################
# Vercel project layer
#############################################

resource "vercel_project" "web_app" {
  name           = "mainecybertech-portal-${var.environment}"
  framework      = "nextjs"
  root_directory = "apps/web"
  build_command  = "pnpm --filter web build"

  git_repository = {
    type = "github"
    repo = var.github_repo
  }
}

resource "vercel_project_environment_variable" "next_public_api_url" {
  project_id = vercel_project.web_app.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = "https://${var.api_domain}"
  target     = ["production", "preview", "development"]
}

resource "vercel_project_domain" "www_prod" {
  project_id = vercel_project.web_app.id
  domain     = "www.mainecybertech.com"
}

resource "vercel_project_domain" "www_test" {
  project_id = vercel_project.web_app.id
  domain     = "www.mainecybertech.us"
}

resource "vercel_project_domain" "app_prod" {
  project_id = vercel_project.web_app.id
  domain     = "app.mainecybertech.com"
}

resource "vercel_project_domain" "app_test" {
  project_id = vercel_project.web_app.id
  domain     = "app.mainecybertech.us"
}
