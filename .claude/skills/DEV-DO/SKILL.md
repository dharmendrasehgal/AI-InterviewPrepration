---
name: dev-devops-implementation
agent: DEV-DO · DevOps Developer
layer: L3 · Engineering & Implementation
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: write IaC modules, build CI/CD pipelines, configure
  monitoring and alerting, provision environments, implement secrets management,
  configure autoscaling, write runbooks, implement disaster recovery procedures,
  or produce a cost report.
reports-to: ARCH-DO
manages: []
---

# DevOps Implementation — DEV-DO Skill

## Why this skill exists

Infrastructure code is production code. An IaC module with hardcoded secrets
creates a credentials leak. A CI/CD pipeline without a rollback step ships
broken deployments with no recovery path. An analytics cluster without a cost
cap creates a surprise cloud bill. This skill enforces patterns that make
infrastructure reliable, auditable, and recoverable.

---

## Step 0 — Before writing any IaC or pipeline code

Confirm you have all required inputs. Block and escalate to ARCH-DO if any are missing.

```
□ Infrastructure Architecture Document from ARCH-DO (current version)
□ IaC Blueprint: module structure, naming conventions, variable standards
□ SLO definitions for services being deployed
□ Observability standards: log schema, metric naming, alert thresholds
□ Secrets management approach: vault path or SSM parameter names defined
□ Deployment strategy specified: blue/green / canary / rolling
□ Rollback procedure designed before deployment pipeline is built
```

---

## §1 · IaC module checklist (per module)

Work through in order. Every module must pass before merge.

```
□ Module has README with: purpose, inputs table, outputs table, example usage
□ All variables have: description, type constraint, and default (or explicit no-default with justification)
□ No hardcoded values — region, account IDs, sizes all in variables or data sources
□ All resources tagged: environment, service, team, cost-center, managed-by=terraform
□ Sensitive variables marked sensitive = true — not printed in plan output
□ Remote state backend configured — no local state files committed
□ State locking enabled
□ outputs.tf exposes useful references for other modules (no internal resource IDs hardcoded externally)
□ Module tested: terraform validate && terraform plan produce no errors in dev environment
□ ARCH-DO review received before merge to main
```

---

## §2 · Terraform module structure

```hcl
# modules/compute/main.tf

# ─── Data sources ──────────────────────────────────────────────────────────────
data "aws_vpc" "main" {
  tags = { Environment = var.environment, ManagedBy = "terraform" }
}

# ─── Resources ─────────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-${var.service_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"   # Container Insights on by default
  }

  tags = local.common_tags
}

# modules/compute/variables.tf
variable "environment" {
  description = "Deployment environment: dev, staging, or production"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "environment must be dev, staging, or production."
  }
}

variable "service_name" {
  description = "Name of the service being deployed (e.g., api, worker, analytics)"
  type        = string
}

variable "db_password" {
  description = "Database password — sourced from AWS SSM Parameter Store"
  type        = string
  sensitive   = true   # prevents logging in plan/apply output
}

# modules/compute/locals.tf
locals {
  common_tags = {
    Environment = var.environment
    Service     = var.service_name
    Team        = "engineering"
    CostCenter  = var.cost_center
    ManagedBy   = "terraform"
  }
}

# modules/compute/outputs.tf
output "cluster_arn" {
  description = "ARN of the ECS cluster — used by service modules"
  value       = aws_ecs_cluster.main.arn
}
```

---

## §3 · CI/CD pipeline implementation patterns

### GitHub Actions pipeline (per ARCH-DO pipeline spec)

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD — [service-name]

on:
  push:
    branches: [main, staging, 'feature/**', 'release/**']
  pull_request:
    branches: [main, staging]

env:
  SERVICE_NAME: api
  ECR_REPOSITORY: ${{ vars.ECR_REPO }}
  AWS_REGION: ${{ vars.AWS_REGION }}

jobs:
  # ── Stage 1: Code Quality ─────────────────────────────────────────────────
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx tsc --noEmit          # type-check
      - run: npm run lint              # eslint
      - run: npm run test:unit -- --coverage  # unit tests
      - name: Check coverage threshold
        run: npx vitest --coverage --reporter=json | jq '.total.lines.pct >= 80'
      - run: npm audit --audit-level=high  # fail on HIGH/CRITICAL CVEs

  # ── Stage 2: Build & Scan ─────────────────────────────────────────────────
  build:
    needs: quality
    runs-on: ubuntu-latest
    outputs:
      image-sha: ${{ steps.meta.outputs.sha }}
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t $ECR_REPOSITORY:${{ github.sha }} .
      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REPOSITORY }}:${{ github.sha }}
          severity: CRITICAL
          exit-code: 1   # block on CRITICAL CVEs
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPOSITORY
          docker push $ECR_REPOSITORY:${{ github.sha }}
      - id: meta
        run: echo "sha=${{ github.sha }}" >> $GITHUB_OUTPUT

  # ── Stage 3: Integration Tests ────────────────────────────────────────────
  integration:
    needs: build
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test, POSTGRES_DB: test }
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run test:integration

  # ── Stage 4: Deploy to Staging ────────────────────────────────────────────
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: integration
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging (blue/green)
        run: ./scripts/deploy.sh --env staging --image-sha ${{ needs.build.outputs.image-sha }}
      - name: Smoke tests
        run: ./scripts/smoke-tests.sh --env staging
      - name: Notify QA-00
        run: ./scripts/notify-qa.sh --env staging --sha ${{ needs.build.outputs.image-sha }}

  # ── Stage 5: Deploy to Production ─────────────────────────────────────────
  deploy-production:
    if: startsWith(github.ref, 'refs/tags/release/')
    needs: [integration, deploy-staging]
    environment: production          # requires manual approval in GitHub Environments
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Canary deploy (10%)
        run: ./scripts/deploy.sh --env production --image-sha ${{ needs.build.outputs.image-sha }} --canary 10
      - name: Monitor canary (5 min)
        run: ./scripts/monitor-canary.sh --duration 300 --error-threshold 0.01
      - name: Promote canary to 100%
        run: ./scripts/deploy.sh --env production --image-sha ${{ needs.build.outputs.image-sha }} --canary 100
```

### Rollback script (mandatory — single command)

```bash
#!/bin/bash
# scripts/rollback.sh
# Usage: ./scripts/rollback.sh --service api --to abc1234

set -euo pipefail

SERVICE=$2; TARGET_SHA=$4
echo "Rolling back $SERVICE to $TARGET_SHA..."

# 1. Revert container image
aws ecs update-service \
  --cluster ${ENV}-cluster \
  --service ${SERVICE} \
  --task-definition ${SERVICE}:${TARGET_SHA} \
  --force-new-deployment

# 2. Wait for stability
aws ecs wait services-stable --cluster ${ENV}-cluster --services ${SERVICE}

# 3. Verify smoke tests pass
./scripts/smoke-tests.sh --env ${ENV}

echo "Rollback complete. $SERVICE is running $TARGET_SHA"
# 4. Post to Slack / notify PM-01 and QA-00
./scripts/notify-rollback.sh --service $SERVICE --sha $TARGET_SHA
```

---

## §4 · Monitoring and alerting configuration

### Alert configuration (Terraform — Datadog example)

```hcl
# modules/observability/alerts.tf

# SLO: API availability > 99.9%
resource "datadog_monitor" "api_availability" {
  name    = "[${var.environment}] API Availability SLO"
  type    = "metric alert"
  message = "@pagerduty-${var.environment} API availability below SLO. Error budget burning. @pm-01 @qa-00"

  query = "sum(last_5m):( sum:api_requests.total{env:${var.environment}} - sum:api_requests.5xx{env:${var.environment}} ) / sum:api_requests.total{env:${var.environment}} * 100 < 99.9"

  monitor_thresholds {
    critical          = 99.5  # page immediately — budget burning fast
    critical_recovery = 99.9
    warning           = 99.7  # warn — budget degrading
  }

  tags = local.common_tags
}

# Analytics cost cap alert
resource "aws_cloudwatch_metric_alarm" "analytics_cost_cap" {
  alarm_name          = "${var.environment}-analytics-cost-cap"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 86400  # daily
  statistic           = "Maximum"
  threshold           = var.analytics_daily_cost_cap_usd
  alarm_description   = "Analytics cluster daily cost exceeded cap. Auto-scaling may be over-provisioning."
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

### Log aggregation pipeline (Terraform — CloudWatch)

```hcl
resource "aws_cloudwatch_log_group" "service" {
  name              = "/ecs/${var.environment}/${var.service_name}"
  retention_in_days = var.environment == "production" ? 90 : 14

  tags = local.common_tags
}

# Log metric filter: extract error counts from structured JSON logs
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.service_name}-error-count"
  log_group_name = aws_cloudwatch_log_group.service.name
  pattern        = "{ $.level = \"ERROR\" }"

  metric_transformation {
    name      = "${var.service_name}_error_count"
    namespace = "Application"
    value     = "1"
  }
}
```

---

## §5 · Secrets management patterns

```hcl
# CORRECT: Reference secrets from SSM — never store values in IaC
data "aws_ssm_parameter" "db_password" {
  name            = "/${var.environment}/${var.service_name}/db_password"
  with_decryption = true
}

resource "aws_ecs_task_definition" "service" {
  # ...
  container_definitions = jsonencode([{
    # ...
    secrets = [
      {
        name      = "DB_PASSWORD"
        valueFrom = data.aws_ssm_parameter.db_password.arn
      }
    ]
  }])
}
```

```bash
# Storing a secret (done once by authorised engineer — not in IaC)
aws ssm put-parameter \
  --name "/production/api/db_password" \
  --value "..." \
  --type SecureString \
  --key-id alias/production-secrets \
  --overwrite
```

---

## §6 · Runbook format (mandatory for every production service)

```markdown
# Runbook: [Service Name] — [Operation Type]
Last updated: YYYY-MM-DD | Author: DEV-DO | Tested in staging: YES

## Overview
[What this runbook covers and when to use it]

## Prerequisites
- Access: [required AWS/GCP role]
- Tools: [aws cli, kubectl, etc. — with version]
- On-call escalation: [PM-01 contact, ARCH-DO contact]

## Procedure

### Step 1 — [Action]
```bash
[exact command]
```
Expected output: [what you should see]
If you see [X] instead: [what to do]

### Step 2 — [Action]
[...]

## Verification
[How to confirm the operation succeeded]

## Rollback
[What to do if this operation needs to be reversed]

## Post-procedure
- [ ] Update incident log
- [ ] Notify PM-01 and QA-00
- [ ] File post-mortem if P0/P1 incident
```

---

## §7 · Analytics cluster configuration

```hcl
# modules/analytics/main.tf

# Auto-scaling with hard cost cap
resource "aws_autoscaling_group" "analytics_workers" {
  name                = "${var.environment}-analytics-workers"
  min_size            = 1
  max_size            = var.analytics_max_nodes  # cost cap enforced via max_size
  desired_capacity    = 1

  # Scale up: CPU > 70% for 2 consecutive 1-min periods
  # Scale down: CPU < 30% for 10 consecutive 1-min periods (avoid thrash)
}

resource "aws_autoscaling_policy" "analytics_scale_up" {
  name                   = "analytics-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 120
  autoscaling_group_name = aws_autoscaling_group.analytics_workers.name
}

# Cost cap alert at 80% of max nodes
resource "aws_cloudwatch_metric_alarm" "analytics_capacity_warning" {
  alarm_name          = "${var.environment}-analytics-capacity-80pct"
  threshold           = var.analytics_max_nodes * 0.8
  alarm_description   = "Analytics cluster at 80% capacity cap. Review ARCH-DO."
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

---

## §8 · Hard rules

- **No production infrastructure change outside IaC** — a console change not reflected in code will be overwritten by the next `terraform apply` and creates state drift.
- **Every secret is in vault/SSM** — a secret value in a `.tfvars` file, environment variable, or code is a P0 security incident.
- **All resources are tagged** — untagged resources cannot be attributed to a service or cost center; they are flagged for deletion.
- **Every CI/CD pipeline has a tested rollback procedure** reachable via a single command.
- **Analytics cluster has a `max_size` cost cap** — open-ended autoscaling is never acceptable.
- **Dev environments auto-destroy** on a nightly schedule — persistent dev infrastructure is waste and drift.
- **Every runbook is tested in staging** before being designated as a production procedure.
- **Alert thresholds match the SLOs defined by ARCH-DO** — never set alerts looser than the SLO without explicit ARCH-DO approval.
