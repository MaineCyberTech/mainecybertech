# Secrets Rotation Policy

## Overview

All secrets must be rotated periodically to limit exposure from credential leaks. This document defines the rotation schedule, procedures, and rollback steps.

## Rotation Schedule

| Secret | Storage | Rotation Frequency | Rotation Method |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | SSM SecureString | Every 90 days | Supabase Dashboard → API Keys → Regenerate |
| `SUPABASE_ANON_KEY` | SSM SecureString | Every 90 days | Supabase Dashboard → API Keys → Regenerate |
| `JWT_SECRET` | SSM SecureString | Every 90 days | Generate new 256-bit secret, update SSM |
| `STRIPE_SECRET_KEY` | SSM SecureString | Every 90 days | Stripe Dashboard → Developers → API Keys → Rollback |
| `JIRA_API_TOKEN` | SSM SecureString | Every 90 days | Jira → Profile → Security → API tokens → Create new |
| `JSM_API_TOKEN` | SSM SecureString | Every 90 days | Same as Jira (same Atlassian account) |
| `M365_CLIENT_SECRET` | SSM SecureString | Every 180 days | Azure Portal → App registrations → Certificates & secrets |
| `DATABASE_URL` | SSM SecureString | On password rotation | Supabase Dashboard → Settings → Database → Reset password |
| `CORS_ORIGIN` | SSM Parameter | As needed | Update in AWS SSM Console |
| `SQS_QUEUE_URL` | SSM Parameter | Never (infrastructure) | Managed by Terraform |
| `VERCEL_TOKEN` | GitHub Secret | Every 90 days | Vercel → Settings → Tokens → Create new |
| `SUPABASE_ACCESS_TOKEN` | GitHub Secret | Every 90 days | Supabase → Account → Access Tokens |
| `CLOUDFLARE_API_TOKEN` | GitHub Secret | Every 90 days | Cloudflare → My Profile → API Tokens |
| `AWS_DEPLOY_ROLE_ARN` | GitHub Secret | Never (infrastructure) | Managed by Terraform OIDC |
| `AWS_TERRAFORM_ROLE_ARN` | GitHub Secret | Never (infrastructure) | Managed by Terraform OIDC |

## Rotation Procedure

### SSM Parameter Store Secrets

1. **Generate new secret** using the appropriate tool (Stripe dashboard, Jira, etc.)
2. **Update SSM parameter:**
   ```bash
   aws ssm put-parameter \
     --name "/mainecybertech/prod/supabase/service-role-key" \
     --type "SecureString" \
     --value "NEW_KEY_HERE" \
     --overwrite
   ```
3. **Force new ECS deployment** to pick up the new secret:
   ```bash
   aws ecs update-service \
     --cluster mainecybertech-cluster \
     --service mainecybertech-api-service \
     --force-new-deployment
   ```
4. **Verify** the new secret works (check CloudWatch logs for auth errors)
5. **Revoke old secret** in the source system (Stripe, Jira, etc.)
6. **Update documentation** with the rotation date

### GitHub Secrets

1. **Generate new token** in the source system
2. **Update GitHub secret:**
   ```bash
   gh secret set VERCEL_TOKEN --body "NEW_TOKEN"
   ```
3. **Revoke old token** in the source system
4. **Verify** CI/CD workflows still work (trigger a test deploy)

### Database Password

1. **Reset password** in Supabase Dashboard → Settings → Database
2. **Update SSM parameter:**
   ```bash
   aws ssm put-parameter \
     --name "/mainecybertech/prod/database/url" \
     --type "SecureString" \
     --value "postgres://postgres:NEW_PASSWORD@db.SUPABASE_ID.supabase.co:5432/postgres" \
     --overwrite
   ```
3. **Also update `db_password` in Terraform state** if managed:
   ```bash
   terraform state mv 'var.db_password' 'var.db_password'
   ```
   Or simply update the variable in your `terraform.tfvars`
4. **Force new ECS deployment**
5. **Verify** connectivity from API and worker

## Automation

### Scheduled Rotation Reminder

Add a calendar event or CI job to remind about upcoming rotations:

```yaml
# .github/workflows/secret-rotation-reminder.yml
name: Secret Rotation Reminder
on:
  schedule:
    - cron: "0 9 1 */3 *"  # Every 3 months on the 1st at 9am UTC
jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create reminder issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Secrets Rotation Reminder',
              body: 'Quarterly secrets rotation is due. Review docs/SECRETS_ROTATION.md for the full list.',
              labels: ['ops', 'security']
            })
```

### Automated Rotation (Future)

For services that support programmatic key rotation:
- **Stripe:** API key rotation via `/v1/api_keys` endpoint
- **Supabase:** Service role key rotation via Management API
- **Atlassian:** API token rotation via SCIM or Atlassian Access

These can be automated with a Lambda function triggered by EventBridge.

## Emergency Rotation

If a secret is suspected compromised:

1. **Revoke immediately** in the source system
2. **Generate new secret**
3. **Update SSM parameter** (see procedure above)
4. **Force ECS redeployment**
5. **Check CloudWatch logs** for unauthorized access patterns
6. **Notify team** via Slack/PagerDuty
7. **Document** the incident and timeline

## Rotation Log

| Date | Secret | Rotated By | Incident? |
|---|---|---|---|
| (Initial deployment) | All | — | No |

Update this table after each rotation event.
