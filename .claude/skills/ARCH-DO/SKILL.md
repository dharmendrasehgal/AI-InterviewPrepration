---
name: arch-devops-architecture
agent: ARCH-DO · DevOps Architect
layer: L2 · Architecture & Design
domain: SaaS / Web Application + Analytics
triggers: >
  Use this skill when asked to: design cloud infrastructure, define IaC strategy,
  architect a CI/CD pipeline, set SLO definitions, design the observability stack,
  produce a disaster recovery plan, optimize cloud costs, or review DEV-DO work.
reports-to: ARCH-00
manages: [DEV-DO]
---

# DevOps Architecture — ARCH-DO Skill

## Why this skill exists

Infrastructure decisions made at the start of a product define the ceiling of its
reliability, scalability, and cost efficiency. An unobservable system cannot be
debugged. A CI/CD pipeline without a rollback gate ships broken code to production.
An analytics cluster without cost caps produces surprise cloud bills.
This skill forces every infrastructure decision to be explicit, documented, and
recoverable.

---

## Step 0 — Intake triage

| Input | First action |
|---|---|
| New service or component from ARCH-BE / ARCH-FE | Define compute, networking, and deployment requirements; update infra diagram |
| New DB deployment requirement from ARCH-DB | Define managed service config, backup schedule, and failover |
| SLO target from PM-01 | Define SLI → SLO → error budget → alerting threshold chain |
| Cost spike alert | Run cost triage (§5) |
| Production incident requiring infra change | Issue a post-mortem action item; produce ADR if architectural |
| New environment requested (e.g., perf testing) | Define IaC module; add to environment registry |

---

## §1 · Infrastructure Architecture Document structure

```markdown
# Infrastructure Architecture Document
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DO
Reviewed by: ARCH-00 | Status: [Draft | Approved]

## 1. Cloud provider and region
- Primary: [AWS / GCP / Azure] — [region]
- DR: [region] (active-passive | active-active)

## 2. Environment inventory
| Environment | Purpose | Data | Auto-destroy? |
|---|---|---|---|
| dev | Feature development | Synthetic only | YES (nightly) |
| staging | Pre-production validation | Anonymised clone | NO |
| production | Live tenants | Real | NO |

## 3. Compute
[ECS / EKS / GKE / Cloud Run — with cluster sizing, autoscaling config, and resource limits]

## 4. Analytics compute
[Separate cluster: node types, autoscaling policy, cost cap, idle timeout]

## 5. Networking
[VPC diagram: public/private subnets, NAT gateway, load balancer, WAF, CDN]

## 6. Data services
[RDS / Cloud SQL config, Redis config, object storage, message queue]

## 7. Security boundaries
[IAM roles, security groups, KMS keys, secrets manager config]

## 8. Observability stack
[Metrics: Datadog/Prometheus | Logs: ELK/CloudWatch | Traces: OpenTelemetry]

## 9. CI/CD pipeline
[Reference to Pipeline Spec document]

## 10. Cost controls
[Budget alerts, analytics cluster cost cap, reserved vs on-demand split]
```

---

## §2 · IaC standards

### Module structure (Terraform)

```
infrastructure/
├── modules/
│   ├── compute/          # ECS cluster, task definitions, autoscaling
│   ├── database/         # RDS, Redis, backups
│   ├── analytics/        # Analytics cluster, cost cap, autoscaling
│   ├── networking/       # VPC, subnets, LB, CDN, WAF
│   ├── observability/    # Dashboards, alerts, log groups
│   └── secrets/          # KMS keys, secret references
├── environments/
│   ├── dev/              # dev.tfvars + main.tf
│   ├── staging/          # staging.tfvars + main.tf
│   └── production/       # production.tfvars + main.tf
└── README.md
```

### Mandatory module standards

Every IaC module authored by DEV-DO must include:

```markdown
# Module: [module-name]

## Purpose
[What this module creates and why]

## Inputs
| Variable | Type | Required | Default | Description |
|---|---|---|---|---|

## Outputs
| Output | Description |
|---|---|

## Mandatory tags applied to all resources
| Tag | Value |
|---|---|
| Environment | var.environment |
| Service | var.service_name |
| Team | engineering |
| CostCenter | var.cost_center |
| ManagedBy | terraform |

## Example usage
[terraform block]
```

### State management

```
- Remote state: S3 (AWS) / GCS (GCP) with DynamoDB / Cloud SQL locking
- State per environment: never share state between environments
- Sensitive outputs: use sensitive = true; never log
- State file access: restricted to CI/CD pipeline role only
```

---

## §3 · CI/CD Pipeline Specification

```markdown
# CI/CD Pipeline Specification
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DO

## Branch strategy
- main: production deployments only (protected; requires PR + CI pass + 1 approval)
- staging: auto-deploys to staging on merge
- feature/*: CI runs; no auto-deploy
- release/*: tagged releases; triggers production pipeline

## Pipeline stages (per service)

### Stage 1 — Code Quality (parallel)
- Type-check (tsc --noEmit / mypy)
- Lint (ESLint / Ruff)
- Unit tests (Vitest / pytest) — fail fast if coverage drops below threshold
- Dependency audit (npm audit / pip-audit) — block on HIGH/CRITICAL CVEs

### Stage 2 — Build & Package
- Docker image build (multi-stage; non-root user)
- Image vulnerability scan (Trivy / Snyk) — block on CRITICAL
- Image push to registry with SHA tag

### Stage 3 — Integration Tests
- Spin up test environment (docker-compose / ephemeral K8s namespace)
- Run API integration tests against built image
- Run DB migration tests against clean schema
- Tear down environment

### Stage 4 — Deploy to Staging (main branch only)
- Apply IaC changes (terraform plan → approve → apply)
- Deploy service (blue/green)
- Smoke tests (5 critical paths)
- QA-00 notified: staging build available for validation

### Stage 5 — Deploy to Production (tagged release only)
- Approval gate: QA-00 sign-off + PM-01 approval
- IaC apply (production)
- Deploy service (canary: 10% → 50% → 100% over 15 min)
- Automated smoke tests at each canary step
- Auto-rollback if error rate > SLO threshold

### Rollback procedure (single command)
./scripts/rollback.sh --service [name] --to [previous-sha]
- Reverts container image to previous SHA
- Re-applies previous IaC state if infrastructure changed
- Completes within 5 minutes
```

---

## §4 · SLO definition format

```markdown
# SLO Definitions
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DO

## Service: [service-name]

### SLI: Request success rate
- Measurement: (total_requests - 5xx_responses) / total_requests
- Exclusions: health check endpoints, known planned downtime windows

### SLO: Availability
- Target: 99.9% over rolling 30-day window
- Error budget: 0.1% = 43.8 minutes/month
- Alert: page on-call when error budget consumed >50% in 24h (burn rate alert)

### SLO: Latency
- Target: P95 < 300ms, P99 < 1000ms (transactional endpoints)
- Analytics light queries: P95 < 2s
- Analytics async jobs: completion within SLA communicated to user

### SLO: Data freshness (analytics)
- Target: dashboard data no older than [T+1h | T+1d — per metric]
- Alert: pipeline delay >2× SLO threshold triggers PagerDuty

## Error budget policy
- 0–25% consumed: normal operations
- 25–75% consumed: PM-01 notified; reliability work prioritised next sprint
- 75–100% consumed: feature freeze; reliability sprint mandated
- 100% consumed: incident declared; post-mortem required within 48h
```

---

## §5 · Cost Triage Protocol

When a cost spike is detected:

**Step 1 — Identify the source**
```bash
# Check by service tag
aws ce get-cost-and-usage --granularity DAILY --filter '{service tag filter}'

# Check analytics compute specifically — most likely culprit
# Verify autoscaling did not over-provision
# Check for data export / scan jobs that ran unexpectedly large
```

**Step 2 — Classify**

| Cause | Action |
|---|---|
| Analytics cluster over-scaled | Review autoscaling policy; lower scale-up threshold; verify cost cap is set |
| Large unintended data scan | Check for missing partition filters in queries; alert DEV-DB |
| Dev environment not auto-destroyed | Trigger destroy pipeline; fix auto-destroy schedule |
| Reserved capacity expired | Renew reservation; update cost optimisation report |
| Data transfer costs | Review cross-region data flows; consider CDN or regional caching |

**Step 3 — Remediate and document**

All cost remediations are documented in the Cost Optimisation Report.
Any change to infrastructure sizing or autoscaling policy requires a PR in IaC.

---

## §6 · Observability standards

### Log schema (mandatory for all services)

```json
{
  "timestamp": "ISO8601",
  "level": "DEBUG | INFO | WARN | ERROR | FATAL",
  "service": "service-name",
  "version": "1.2.3",
  "trace_id": "uuid",
  "span_id": "uuid",
  "tenant_id": "uuid (if request-scoped; NEVER log PII here)",
  "user_id": "uuid (if request-scoped; hash if PII concern)",
  "message": "human-readable description",
  "error": { "type": "ErrorClassName", "message": "sanitised message", "stack": "dev/staging only" },
  "duration_ms": 123,
  "http": { "method": "POST", "path": "/api/v1/...", "status": 200 }
}
```

### Metric naming convention

```
{service_name}_{metric_name}_{unit}
Examples:
  api_request_duration_seconds
  analytics_query_duration_seconds
  worker_job_queue_depth_count
  db_connection_pool_active_count
```

### Alerting hierarchy

```
P0 — Production outage / data breach → PagerDuty (immediate) + PM-01 + ARCH-00
P1 — SLO error budget >75% consumed → PagerDuty (15min) + PM-01
P2 — SLO error budget >50% consumed → Slack alert + QA-00 + PM-01
P3 — Degraded performance within SLO → Slack alert (business hours)
```

---

## §7 · Disaster Recovery Plan structure

```markdown
# Disaster Recovery Plan
Version: [N] | Date: YYYY-MM-DD | Author: ARCH-DO
Last DR test: YYYY-MM-DD | Next DR test: YYYY-MM-DD

## Recovery tiers
| Tier | Services | RPO | RTO |
|---|---|---|---|
| Tier 1 (Critical) | Auth, core API, billing | 15 min | 1 hour |
| Tier 2 (High) | Analytics API, dashboards | 4 hours | 4 hours |
| Tier 3 (Standard) | Async jobs, reports | 24 hours | 8 hours |

## Backup schedule
| Data store | Backup frequency | Retention | Restore test frequency |
|---|---|---|---|
| PostgreSQL (OLTP) | Continuous WAL + daily snapshot | 30 days | Monthly |
| OLAP store | Daily export to cold storage | 90 days | Quarterly |
| Redis | RDB snapshot every 1h | 7 days | Quarterly |

## Failover runbook
[Step-by-step: detect → declare incident → initiate failover → validate → communicate → resolve]

## DR test schedule
Quarterly: full failover test to DR region (staging environment)
Monthly: backup restore validation
Weekly: automated smoke test against DR standby
```

---

## §8 · Hard rules

- **No production infrastructure change outside IaC** — a console-click change that is not reflected in IaC is rolled back at the next apply.
- **Every service emits logs, metrics, and traces before it is production-ready** — observability is not optional.
- **Every CI/CD pipeline has a documented, tested rollback procedure** — a pipeline without rollback is not production-ready.
- **Analytics compute has a hard cost cap** — no unbounded autoscaling; alert at 80% of cap, hard stop at 100%.
- **Dev environments auto-destroy on a schedule** — persistent dev environments leak money and drift from IaC state.
- **SLO breaches trigger automated alerts within 5 minutes** — not discovered in the next morning's standup.
- **DR procedures are tested quarterly** — an untested DR plan is not a DR plan.
- **Brief DEV-DO in writing** with the IaC module design, pipeline spec, and observability requirements before each sprint.
