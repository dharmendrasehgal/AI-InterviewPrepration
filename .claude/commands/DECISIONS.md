# Architecture Decision Record — Interview Preparation Platform

> **Every agent reads this file first.** These decisions are final for Phase 1.
> Do not re-derive or re-debate them. Follow them and add new entries when you make a new decision.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Frontend | Next.js App Router | ^15.0.0 | Uses `next.config.ts` (not `.js`) |
| Frontend state | Zustand | ^5.0.0 | In-memory token store (no localStorage) |
| Frontend queries | TanStack Query | ^5.59.0 | Server state caching |
| Backend | Fastify | ^5.8.5 | TypeScript strict mode |
| ORM | Drizzle ORM | ^0.45.2 | node-postgres driver |
| Database | PostgreSQL 16 | — | pg_trgm for full-text search |
| Queue | BullMQ | ^5.77.4 | Bundles its own ioredis — do NOT import standalone ioredis |
| Cache | Redis 7 | — | Via BullMQ only in Phase 1 |
| AI scoring | Anthropic SDK | ^0.99.0 | Model: `claude-sonnet-4-6`, prompt caching enabled |
| Object storage | AWS SDK v3 | ^3.750.0 | LocalStack for dev (forcePathStyle: true required) |
| Auth | jsonwebtoken | ^9.0.3 | RS256 algorithm; public key verifies, private key signs |
| Password hashing | bcrypt | ^5.1.1 | 12 rounds |
| Field encryption | Node.js crypto | built-in | AES-256-GCM; IV 12B + authTag 16B + ciphertext, base64 |

---

## File & Directory Conventions

```
outputs/implementation/
  backend/          # Fastify API — entry: server.ts, worker: worker.ts
  frontend/         # Next.js 15 App Router
  devops/           # docker-compose.yml, Dockerfile, .env, init scripts
```

- Backend path alias: `@/` maps to `./*` (tsconfig `paths`)
- Backend modules live at `modules/<module-name>/<module-name>.{routes,service,schema}.ts`
- Frontend API client: `lib/api/client.ts` (single file, all API calls)
- Frontend store: `lib/store/auth.ts` (Zustand)

---

## Database Schema Decisions

| Decision | Detail |
|----------|--------|
| All PKs | UUID, `gen_random_uuid()` default |
| Email storage | `email_hash` SHA-256 (for lookup) + `email_encrypted` AES-256-GCM |
| Full name storage | `full_name_encrypted` AES-256-GCM |
| Refresh tokens | Stored as SHA-256 hash in `refresh_tokens` table; rotated on each use |
| Questions `questionId` | UUID FK referencing `questions.id` — not a plain text field |
| Tags column | `jsonb` typed as `string[]` |
| All timestamps | `timestamp with timezone` (`withTimezone: true`) |
| Indexes | Created on all FK columns and common filter columns |
| Migration runner | `db/migrate.ts` — reads SQL from `db/migrations/*.sql`, idempotent |

### Table list (Phase 1)
`users`, `refresh_tokens`, `candidate_profiles`, `questions`, `question_answers`, `bookmarks`, `mock_sessions`, `session_responses`

---

## API Conventions

### Response shape
```typescript
// Success
{ data: T, meta?: Record<string, unknown> }

// Error
{ error: { code: string, message: string, details?: unknown, correlation_id?: string } }
```

### Error codes
| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Zod parse failure |
| `UNAUTHORIZED` | 401 | Missing/invalid/expired token |
| `FORBIDDEN` | 403 | Insufficient role or CSRF check failed |
| `NOT_FOUND` | 404 | Resource does not exist |
| `EMAIL_EXISTS` | 409 | Duplicate registration |
| `INVALID_STATE` | 400 | State machine violation (e.g., wrong session status) |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

### Pagination
All list endpoints use **cursor-based pagination**:
```typescript
{ items: T[], next_cursor: string | null, has_more: boolean, total: number }
```
Query params: `cursor`, `page_size` (max 100, default 20)

### Route prefix: `/api/v1/`

---

## Security Decisions

| ID | Decision |
|----|----------|
| DEF-001 | Access tokens stored in Zustand memory — NEVER localStorage |
| DEF-002 | CSRF: `/auth/refresh` and `/auth/logout` require `X-Requested-With: XMLHttpRequest` |
| DEF-003 | Refresh cookie: `HttpOnly; SameSite=Strict; path=/api/v1/auth` |
| DEF-004 | JWT: RS256 algorithm; `getPrivateKey()` is lazy (read from `JWT_PRIVATE_KEY_FILE`) |
| DEF-005 | PII fields (email, full_name) encrypted with AES-256-GCM using `FIELD_ENCRYPTION_KEY` |
| DEF-006 | File upload: no `Content-Type` header set — browser sets `multipart/form-data` with boundary |
| DEF-007 | `verifyAccessToken` uses private key (jsonwebtoken extracts public portion for RS256 verify) |

---

## Key Implementation Patterns

### Error throwing pattern (backend)
```typescript
throw Object.assign(new Error('Human message'), { code: 'ERROR_CODE', status: 404 })
```

### Auth middleware
```typescript
// requireRole() must NOT be async at the outer function level
// It returns an async handler — the outer wrapper is a plain function
export function requireRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => { ... }
}
export const requireAdmin = requireRole('admin')      // these are FUNCTIONS, not Promises
export const requireCandidate = requireRole('candidate')
```

### BullMQ queue connection
```typescript
// Always parse REDIS_URL — do not use ioredis directly
function parseRedisConnection(url: string) {
  const parsed = new URL(url)
  return { host: parsed.hostname, port: Number(parsed.port) || 6379, ... }
}
```

### Environment loading
```typescript
// FIRST line of server.ts and worker.ts — before any other import
import 'dotenv/config'
```

### Dynamic imports
Do NOT use `await import('drizzle-orm')` — import all drizzle operators statically at the top.
Use `notInArray` from static import, not dynamic.

---

## Handoff Files

When you complete a task, write a summary to:
```
outputs/.agent-handoffs/<your-agent-name>.md
```

Use this template:
```markdown
## Agent: <name>
## Completed: <ISO date>

### Files created/modified
- path/to/file.ts — what it does

### Key decisions made
- Decision 1 (and why)

### Known issues / next agent must know
- Issue or constraint the next agent needs to handle
```

## Checkpoint Files

Write a checkpoint marker when your task is complete:
```
outputs/.agent-checkpoints/<your-agent-name>.done
```
Content: the ISO timestamp. The orchestrating agent checks for this before assuming success.

---

## Open Questions (do not resolve unilaterally)

- Monetization model (free vs. premium tiers) — not yet defined
- Email provider (SendGrid vs. SES vs. Resend) — `emailService` is a stub
- WebRTC signaling for live sessions — deferred to Phase 2
- Admin dashboard — deferred to Phase 2
