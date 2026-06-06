# Flattened Active Root File Walkthrough

## `active.variables.tf`
This is the single merged variable surface for runtime, hardening, DNS, and GitHub OIDC.

## `active.providers.tf`
Adds Cloudflare provider support to the active root. The earlier core stack is still expected to handle AWS/Vercel/Supabase provider configuration.

## `active.runtime.networking.tf`
Contains the ALB, target group, and the security groups/rules required to expose the API publicly while keeping tasks private.

## `active.runtime.services.tf`
Contains the ECS cluster, CloudWatch log groups, hardened task definitions, and service resources.

## `active.runtime.autoscaling.tf`
Contains API and worker autoscaling targets plus CPU target-tracking policies.

## `active.cicd.cloudflare-dns.tf`
Contains Cloudflare DNS resources for the production and testing app/API hostnames.

## `active.cicd.github-oidc.tf`
Contains the AWS OIDC provider and IAM roles used by GitHub Actions.

## `active.outputs.tf`
Contains outputs used for validation, CI/CD wiring, and operator visibility.
