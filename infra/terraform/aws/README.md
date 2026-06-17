# AWS Infrastructure (Dormant)

This Terraform configuration managed the AWS infrastructure (ECS, ECR, SQS, ALB, SSM, CloudWatch, etc.) for the MCT portal.
It is currently dormant — the stack has been migrated to DigitalOcean.

To destroy AWS resources, run:

```
terraform init
terraform destroy
```

From this directory with appropriate AWS credentials.
