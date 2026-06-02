# API Overview
## Interview Preparation Platform — Public API

> Version: v1 | Base URL: `https://api.platform.com/api/v1`  
> Format: JSON | Auth: Bearer token (JWT RS256)

---

## Introduction

The Interview Preparation Platform API allows you to integrate question bank content, session data, and scoring analytics into your own applications. All endpoints return JSON and use standard HTTP status codes.

This documentation covers the public API available to approved integration partners. For the full internal API specification used by the web application, see [api_contracts.md](../../architecture/backend/api_contracts.md).

---

## Authentication

All API requests (except public endpoints) require a valid access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Obtaining a token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword1!"
}
```

**Response:**
```json
{
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiJ9...",
    "expires_in": 900
  }
}
```

Access tokens expire after **15 minutes**. Use `POST /auth/refresh` (with your `HttpOnly` refresh cookie) to obtain a new token without re-entering credentials.

---

## Response Format

All responses use a consistent envelope:

```json
{
  "data": { ... },
  "meta": { "next_cursor": "...", "has_more": true, "total": 243 }
}
```

Errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": { "field": "email", "issue": "Invalid format" }
  }
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or expired token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource does not exist |
| `422` | Unprocessable Entity — validation failed |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error — contact support |

---

## Rate Limiting

| Scope | Limit |
|-------|-------|
| Authenticated requests | 1,000 requests / minute |
| Authentication endpoints (`/auth/login`, `/auth/register`) | 10 requests / 15 minutes per IP |
| File uploads (`/users/me/resume`, `/mock-sessions/*/responses`) | 20 requests / minute |

When a rate limit is hit, the response includes:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": { "retry_after_seconds": 60 }
  }
}
```

---

## Pagination

List endpoints use **cursor-based pagination**:

```http
GET /questions?page_size=25&cursor=<next_cursor_value>
```

The `meta` field in every list response contains:

```json
{
  "meta": {
    "next_cursor": "dXNlcjox...",
    "has_more": true,
    "total": 243
  }
}
```

Pass `next_cursor` as the `cursor` query parameter to fetch the next page. When `has_more` is `false`, you have reached the last page.

---

## Core Endpoints

### Question Bank

#### List questions
```http
GET /questions
```
Query parameters: `type`, `level`, `industry`, `tag`, `cursor`, `page_size` (default 25, max 100)

```bash
curl https://api.platform.com/api/v1/questions \
  -H "Authorization: Bearer <token>" \
  -G -d "type=behavioral" -d "level=mid" -d "page_size=10"
```

#### Search questions
```http
GET /questions/search?q=leadership&suggest=true
```

#### Get a single question with sample answers
```http
GET /questions/{question_id}
```

---

### Mock Sessions

#### Create a session
```http
POST /mock-sessions
Content-Type: application/json

{
  "question_count": 5,
  "track": "software_engineering",
  "level": "mid"
}
```

#### Record consent (required before any recording begins)
```http
POST /mock-sessions/{session_id}/consent
```

Returns a `session_token` confirming consent was logged. The session will not proceed to recording without this call succeeding.

#### Get next question
```http
GET /mock-sessions/{session_id}/question
```

#### Upload a response recording
```http
POST /mock-sessions/{session_id}/responses
Content-Type: multipart/form-data

Fields:
  question_id   (string, required)
  response_index (integer, required)
  recording     (file — video/webm or video/mp4, max 100 MB)
```

#### Mark session complete and trigger scoring
```http
POST /mock-sessions/{session_id}/complete
```

#### Get AI score report
```http
GET /mock-sessions/{session_id}/score
```

Returns the full score report. If scoring is still in progress, returns `HTTP 202 Accepted` with `{ "status": "processing" }`. Poll every 5 seconds until `HTTP 200`.

---

### Feedback Archive

#### List all sessions
```http
GET /feedback
```
Query parameters: `type` (`ai`, `live`, `all`), `date_from`, `date_to`, `score_min`, `score_max`, `cursor`

#### Get signed recording URL (expires in 1 hour)
```http
GET /feedback/{session_id}/recording
```

#### Download transcript as PDF
```http
GET /feedback/{session_id}/transcript/pdf
```
Returns a binary PDF stream. Set `Accept: application/pdf`.

---

## Webhooks (Partner Integrations)

Webhook delivery is available to approved integration partners. Contact partnerships@platform.com to register a webhook endpoint.

### Supported events

| Event | Trigger |
|-------|---------|
| `session.score_ready` | AI score report is available after a session |
| `session.booking_confirmed` | A live session booking is confirmed |
| `session.cancelled` | A live session booking is cancelled |
| `evaluation.submitted` | An expert rubric evaluation is submitted |

### Webhook payload format
```json
{
  "event": "session.score_ready",
  "payload": {
    "session_id": "ms_01",
    "candidate_id": "usr_01",
    "composite_score": 76,
    "scored_at": "2026-05-26T10:15:00Z"
  },
  "timestamp": "2026-05-26T10:15:05Z",
  "webhook_id": "wh_abc123"
}
```

Webhooks are signed with an HMAC-SHA256 signature in the `X-Platform-Signature` header. Verify the signature before processing:

```python
import hmac, hashlib

def verify_signature(payload_bytes: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## SDKs & Code Examples

Official SDKs are in development for **TypeScript/Node.js** and **Python**. Until then, use any HTTP client with the endpoints documented above.

**TypeScript example — run a complete AI mock session:**
```typescript
const session = await fetch('/api/v1/mock-sessions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ question_count: 3, track: 'general', level: 'mid' }),
}).then(r => r.json())

await fetch(`/api/v1/mock-sessions/${session.data.session_id}/consent`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
})

// ... record responses, then:
await fetch(`/api/v1/mock-sessions/${session.data.session_id}/complete`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
})
```

---

## Support

- **API issues:** api-support@platform.com
- **Status page:** status.platform.com
- **Changelog:** platform.com/api/changelog
