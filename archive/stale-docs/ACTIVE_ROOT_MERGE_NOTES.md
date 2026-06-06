# Active Root Merge Notes

## What was flattened
This active root pack flattens the earlier separated runtime, hardening, CI/CD, and domain-completion concepts into directly usable Terraform root files.

## What remains as external dependency
These files still depend on your earlier core root files that create the VPC, ECR repositories, Supabase project, task execution role, and other foundational resources.

## Why this design is recommended
It gives you:
- one operator-facing Terraform root
- separate dev/testing and prod environment files
- commented `.tf` files that explain operational intent
- a cleaner long-term maintenance pattern
