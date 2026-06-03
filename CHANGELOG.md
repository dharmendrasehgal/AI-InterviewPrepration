# Changelog
## Interview Preparation Platform

All notable changes to this project will be documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0-alpha.1] — 2026-06-02

### Added
- Phase 2 scope definition: Expert Registration & Admin Approval, Expert Marketplace, Session Booking System, WebRTC Live Interview, Expert Rubric Evaluation, Industry Playbooks, Self-Practice Tool, and Notification Service
- Phase 2 implementation roadmap covering 8 new backend modules, 6 new database tables, and 7 new frontend page groups
- Gate report `outputs/releases/v1.1.0-gate-report.md` documenting all Phase 1 blocking issues and Phase 2 development authorization
- Rollback runbook `outputs/releases/v1.1.0-rollback-runbook.md` with actionable AWS ECS/ALB steps
- `GET /api/v1/mock-sessions/:id/ice-config` stub (Phase 2 WebRTC pre-stub, non-functional placeholder)

### Changed
- Version bumped from `1.0.0` to `1.1.0-alpha.1` to open Phase 2 development track

### Security
- Identified DEF-001 (access_token in localStorage — XSS risk) as Phase 2 GA blocker; assigned to `frontend_developer_agent` for immediate remediation
- Identified ioredis standalone dependency violating DECISIONS.md BullMQ connection policy; marked for removal

### Migration Notes
- No schema changes in this pre-release
- Phase 2 will introduce new tables: `experts`, `expert_availability`, `bookings`, `expert_sessions`, `playbooks`, `rubric_evaluations` — all migrations will ship with corresponding down scripts
- Existing Phase 1 API contracts are unchanged; Phase 2 adds new endpoints only

---

## [1.0.0] — 2026-05-27

### Added
- User Registration & Authentication — candidate and admin roles, JWT RS256 with HttpOnly cookie refresh token rotation
- Candidate Profile Setup — resume upload (S3 / LocalStack), target role configuration
- Candidate Dashboard — total sessions, average score, 10-session trend chart
- Question Bank — ≥200 expert-vetted questions across Behavioral, Technical, and Situational types; career levels Entry, Mid, Senior, Executive; JSONB tags with pg_trgm full-text search
- Full-Text Search & Autocomplete — `GET /api/v1/questions/search` with `suggest` mode
- Question Bookmarks — `POST` and `DELETE /api/v1/questions/:id/bookmark` with idempotent upsert
- AI Mock Interview Sessions — on-demand, adaptive session flow with consent gate, recording upload, and BullMQ-backed scoring pipeline
- AI Score Report — per-question breakdown: speech rate, filler word count, keyword relevance; overall Clarity Score 0–100 powered by Anthropic Claude (claude-sonnet-4-6) with prompt caching
- Feedback Archive — session history with recording, transcript, AI scores, and improvement tips
- Session Recording Upload — multipart upload to S3 with presigned URL generation

### Security
- AES-256-GCM field encryption for all PII (email, full name) using `FIELD_ENCRYPTION_KEY`
- Email lookup via SHA-256 hash — plaintext email never stored
- RS256 JWT with private key signing; `verifyAccessToken` uses private key (jsonwebtoken extracts public portion per DEF-007)
- CSRF defence on `/auth/refresh` and `/auth/logout` via `X-Requested-With: XMLHttpRequest` custom header requirement
- Refresh token stored as SHA-256 hash; rotated on every use; 30-day TTL
- HttpOnly, SameSite=Strict cookie for refresh token; path scoped to `/api/v1/auth`
- Rate limiting: 200 req/min per IP via `@fastify/rate-limit`
- Helmet headers on all responses

### Migration Notes
- First release — no migration required
- Run `npm run db:migrate` against a PostgreSQL 16 instance to apply `0001_initial.sql`
- Set `JWT_PRIVATE_KEY_FILE` or `JWT_PRIVATE_KEY` environment variable to an RSA-4096 private key in PEM format
- Set `FIELD_ENCRYPTION_KEY` to a 256-bit (64 hex character) random value

---

*See `outputs/content/release-notes/` for user-facing release notes.*
