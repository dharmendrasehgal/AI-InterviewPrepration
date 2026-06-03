# GitHub Workflows Quick Reference

## Workflow Triggers

| Event | Branch | Workflow | Action |
|-------|--------|----------|--------|
| Push | `develop` | `deploy-staging` | Deploy to staging |
| Push | `master`/`main` | `build-docker` | Build Docker images |
| Git tag | `v*` | `release` | Create release & deploy |
| PR | Any | `build-and-test` | Run CI checks |
| Manual | Any | Any | Dispatch workflow |

---

## Manual Workflow Triggers

### Via GitHub CLI
```bash
gh workflow run deploy-staging.yml
gh workflow run deploy-production.yml

### Create a Release
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

## Development Workflow

### Feature Development
```bash
git checkout -b feature/xxx develop
# ... make changes ...
git push origin feature/xxx
# Create PR on GitHub
# CI runs automatically

### Production Release
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# Requires manual approval

### Repository Secrets
```bash
AWS_ROLE_TO_ASSUME=arn:aws:iam::ACCOUNT_ID:role/github-actions-role
AWS_REGION=us-east-1
SLACK_WEBHOOK=https://hooks.slack.com/services/...

### Branch Strategy
```bash
feature/xxx (PR) ──→ develop (staging) ──→ main/master (production)
                                               ↓
                                            v1.0.0 (release tag)

### Workflow Files
```bash
.github/workflows/
├── build-and-test.yml      # CI pipeline
├── build-docker.yml        # Docker builds
├── deploy-staging.yml      # Staging deployment
├── deploy-production.yml   # Production deployment
├── code-quality.yml        # Security & QA
└── release.yml             # Release management

docs/
├── WORKFLOWS_SETUP.md
└── WORKFLOWS_QUICK_REFERENCE.md

### Debugging
#### View Logs
