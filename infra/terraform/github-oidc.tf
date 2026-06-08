#############################################
# GitHub OIDC for CI/CD
#
# This file enables GitHub Actions to assume AWS roles
# using OIDC instead of long-lived AWS access keys.
#############################################

locals {
  github_oidc_sub_main = "repo:${var.github_repository}:ref:refs/heads/${var.github_default_branch}"
}

data "aws_iam_policy_document" "github_oidc_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_oidc_sub_main]
    }
  }
}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "github_terraform" {
  name               = var.github_oidc_role_name_terraform
  assume_role_policy = data.aws_iam_policy_document.github_oidc_assume_role.json
}

resource "aws_iam_role" "github_deploy" {
  name               = var.github_oidc_role_name_deploy
  assume_role_policy = data.aws_iam_policy_document.github_oidc_assume_role.json
}