# Rollback Procedures

## ECS Service Rollback

### API Service
```bash
# List task definitions to find the previous version
aws ecs describe-service \
  --cluster mainecybertech-cluster \
  --service mainecybertech-api-service \
  --region us-east-1

# Rollback to previous task definition
aws ecs update-service \
  --cluster mainecybertech-cluster \
  --service mainecybertech-api-service \
  --task-definition mainecybertech-api-runtime:PREVIOUS_REVISION \
  --region us-east-1
```

### Worker Service
```bash
aws ecs update-service \
  --cluster mainecybertech-cluster \
  --service mainecybertech-worker-service \
  --task-definition mainecybertech-worker-runtime:PREVIOUS_REVISION \
  --region us-east-1
```

### Using ECS Circuit Breaker
ECS deployment circuit breaker is enabled with rollback on both services.
If a deployment fails health checks, ECS will automatically roll back to the previous task definition.
Check rollback status:
```bash
aws ecs describe-services \
  --cluster mainecybertech-cluster \
  --services mainecybertech-api-service \
  --query 'services[0].rolloutDetails' \
  --region us-east-1
```

## Vercel Rollback

```bash
# List recent deployments
vercel ls --token $VERCEL_TOKEN

# Rollback to a specific deployment
vercel rollback <deployment-url> --token $VERCEL_TOKEN

# Or via Vercel dashboard: https://vercel.com/dashboard
```

## Supabase Rollback

```bash
# List migrations
supabase migration list --project-ref $SUPABASE_PROJECT_REF

# Roll back the last migration (requires manual SQL)
# 1. Review the migration file in supabase/migrations/
# 2. Write a reverse migration
# 3. Apply it
supabase db push --project-ref $SUPABASE_PROJECT_REF
```

## Terraform Rollback

```bash
# View current state
cd infra/terraform
terraform state list

# Roll back to previous state
terraform apply -var-file=env/prod.tfvars -target=<resource>

# Or revert the commit and re-apply
git revert <commit-hash>
terraform apply -var-file=env/prod.tfvars
```

## Emergency Contacts

| Service | Issue | Action |
|---------|-------|--------|
| API | Health check failing | ECS auto-rollback; check CloudWatch logs |
| Web | Build/deploy failure | Vercel dashboard → Redeploy previous |
| Worker | Not processing jobs | Check SQS queue; restart task |
| Database | Migration failure | Apply reverse migration manually |
| DNS | Resolution failure | Check Cloudflare dashboard |

## Production Approval Gate

All production deployments require approval through the `prod-approval` GitHub environment.
This is configured as a required environment with 1+ required reviewers.

To configure: **Settings → Environments → prod-approval → Required reviewers**

## Deployment Checklist

Before approving a production deployment:
1. Verify all tests pass in CI
2. Review the PR diff and change log
3. Confirm no schema-breaking Supabase migrations
4. Check that E2E tests pass on develop
5. Verify the deployment was successful on develop first