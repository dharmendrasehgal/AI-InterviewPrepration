# GitHub Workflows Setup Guide - Interview Preparation Platform

## Overview

This comprehensive guide outlines the complete GitHub Actions CI/CD pipeline for the fullstack Interview Preparation Platform.

### Stack
- **Backend**: Fastify + Node.js with TypeScript
- **Frontend**: Next.js with React  
- **Infrastructure**: Docker + AWS ECS
- **Languages**: TypeScript (77.9%), PLpgSQL (11.2%), CSS (9%), JavaScript (1.4%)

---

## Quick Start Checklist

- [ ] Configure Repository Secrets (AWS role, Slack webhook)
- [ ] Create Dockerfile for backend and frontend
- [ ] Create ECS task definitions
- [ ] Set branch protection rules
- [ ] Create GitHub environments (production, staging)
- [ ] Test with develop branch push

---

## 1. Build & Test CI Workflow

**File**: `.github/workflows/build-and-test.yml`

### Triggers
- Push to `master`, `main`, `develop`
- Pull requests to `master`, `main`, `develop`
- Changes in `outputs/implementation/**`

### Jobs

#### TypeScript Type Check
- Validates compilation for backend and frontend
- Fails workflow if type errors exist
- Duration: ~3-5 min

#### Backend Build & Test
- PostgreSQL + Redis services
- Unit tests with Vitest
- Build distribution
- Uploads artifacts
- Duration: ~8-10 min

#### Frontend Build & Test
- ESLint linting
- Unit tests with Vitest
- Next.js build
- Uploads artifacts
- Duration: ~10-12 min

#### E2E Tests
- Runs Playwright tests
- Full application flow testing
- Duration: ~8-10 min

#### CI Status Check
- Final aggregation
- All jobs must pass

---

## 2. Build Docker Images Workflow

**File**: `.github/workflows/build-docker.yml`

### Purpose
Builds and pushes Docker images to GitHub Container Registry (GHCR).

### Triggers
- Push to `master` or `main`
- After successful CI workflow

### Features
- Multi-stage Docker builds
- Automatic tagging (SHA, semver, latest)
- GitHub Actions layer caching
- GHCR registry push

---

## 3. Deploy to Staging Workflow

**File**: `.github/workflows/deploy-staging.yml`

### Purpose
Auto-deploys to staging on `develop` branch push.

### Deployment Flow
1. Build Docker images with `staging-{sha}` tag
2. Push to GHCR
3. Configure AWS credentials
4. Update ECS services
5. Wait for stabilization
6. Run health checks
7. Send Slack notification

### Secrets Required

---

## 4. Deploy to Production Workflow

**File**: `.github/workflows/deploy-production.yml`

### Purpose
Manual production deployment with approval gates.

### Jobs

1. **Approval Gate** - Manual approval required
2. **Deploy** - ECS updates + migrations
3. **Smoke Tests** - Post-deployment validation

---

## 5. Code Quality & Security Workflow

**File**: `.github/workflows/code-quality.yml`

### Purpose
Security scanning, dependency audit, and code quality checks.

### Jobs

1. **Security Analysis** - GitHub CodeQL scanning
2. **Dependency Check** - NPM audit
3. **ESLint Analysis** - Code quality

---

## 6. Release Management Workflow

**File**: `.github/workflows/release.yml`

### Purpose
Versioned releases and production deployments.

### Triggers
- Git tag `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch

### Release Example
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Automatically:
# 1. Creates GitHub Release
# 2. Builds Docker v1.0.0 images
# 3. Deploys to production (after approval)
# 4. Sends Slack notification
