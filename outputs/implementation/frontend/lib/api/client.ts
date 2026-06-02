/**
 * Typed API client — wraps fetch with auth token injection,
 * consistent error handling, and response parsing.
 * DEF-001: Tokens stored in memory via Zustand, NOT localStorage.
 */

import { useAuthStore } from '@/lib/store/auth'

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // DEF-001: Read token from in-memory store, not localStorage
  const token = useAuthStore.getState().accessToken

  // DEF-006: Only set Content-Type when body is not FormData
  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {}
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Merge caller-supplied headers (they take precedence)
  if (options.headers) {
    const supplied = new Headers(options.headers as HeadersInit)
    supplied.forEach((value, key) => {
      headers[key] = value
    })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`, {
    ...options,
    credentials: 'include', // send refresh token cookie
    headers,
  })

  if (res.status === 401) {
    // Attempt silent token refresh before failing
    const newToken = await refreshAccessToken()
    if (newToken) {
      return request<T>(path, options) // retry once
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new ApiError('UNAUTHORIZED', 'Session expired', 401)
  }

  // DEF-007: Handle 202 Accepted (processing) without trying to parse as full response
  if (res.status === 202) {
    const body = await res.json().catch(() => ({}))
    return (body as ApiResponse<T>).data ?? ({ status: 'processing' } as unknown as T)
  }

  const body = await res.json()

  if (!res.ok) {
    throw new ApiError(
      body.error?.code ?? 'UNKNOWN',
      body.error?.message ?? 'Request failed',
      res.status,
      body.error?.details,
    )
  }

  return (body as ApiResponse<T>).data
}

function decodeJwtPayload(token: string): { sub: string; role: string } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      },
    )
    if (!res.ok) return null
    const body = await res.json()
    const token: string = body.data.access_token
    const store = useAuthStore.getState()
    store.setAccessToken(token)
    const claims = decodeJwtPayload(token)
    if (claims) store.setUser({ id: claims.sub, role: claims.role as 'candidate' | 'expert' | 'admin' })
    return token
  } catch {
    return null
  }
}

// ─── Auth ─────────────────────────────────────────────────────

export const authApi = {
  login: (dto: { email: string; password: string }) =>
    request<{ access_token: string; expires_in: number; user: { user_id: string; role: string; email_verified: boolean } }>('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),
  register: (dto: { email: string; password: string; full_name: string; role: 'candidate' | 'expert' }) =>
    request<{ user_id: string; email: string; role: string }>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    }),
}

// ─── Question Bank ────────────────────────────────────────────

export interface Question {
  id: string
  text: string
  type: 'behavioral' | 'technical' | 'situational' | 'role_specific'
  level: 'entry' | 'mid' | 'senior' | 'executive'
  industry: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags: string[]
  framework: string | null
  bookmarked: boolean
}

export interface QuestionDetail extends Question {
  answers: Array<{ id: string; answer_text: string; keywords: string[]; is_primary: boolean }>
}

export interface PaginatedResponse<T> {
  items: T[]
  next_cursor: string | null
  has_more: boolean
  total: number
}

export const questionsApi = {
  list: (params: {
    type?: string
    level?: string
    industry?: string
    tag?: string
    cursor?: string
    page_size?: number
  }) =>
    request<PaginatedResponse<Question>>(
      `/questions?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).filter(([, v]) => v != null),
        ) as Record<string, string>,
      )}`,
    ),

  get: (id: string) => request<QuestionDetail>(`/questions/${id}`),

  search: (q: string, suggest = false) =>
    request<{ suggestions: string[]; results: Question[] }>(
      `/questions/search?q=${encodeURIComponent(q)}&suggest=${suggest}`,
    ),

  bookmark: (id: string) =>
    request<void>(`/questions/${id}/bookmark`, { method: 'POST' }),

  unbookmark: (id: string) =>
    request<void>(`/questions/${id}/bookmark`, { method: 'DELETE' }),

  bookmarked: () => request<Question[]>('/questions/bookmarked'),
}

// ─── Mock Sessions ────────────────────────────────────────────

export interface MockSession {
  session_id: string
  status: 'awaiting_consent' | 'in_progress' | 'processing' | 'scored' | 'failed'
  question_count: number
}

export interface SessionQuestion {
  id: string
  text: string
  framework: string | null
  response_index: number
}

export interface ScoreReport {
  session_id: string
  composite_score: number
  completed_at: string
  per_question: Array<{
    question_id: string
    speech_rate_wpm: number
    filler_word_count: number
    filler_percentage: number
    keyword_relevance: number
    clarity_score: number
    improvement_tip: string
  }>
  session_summary: {
    avg_speech_rate_wpm: number
    total_filler_words: number
    avg_keyword_relevance: number
  }
}

export const mockSessionsApi = {
  create: (params: { question_count: number; track: string; level: string }) =>
    request<MockSession>('/mock-sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  recordConsent: (sessionId: string) =>
    request<{ consent_logged_at: string; session_token: string }>(
      `/mock-sessions/${sessionId}/consent`,
      { method: 'POST' },
    ),

  getNextQuestion: (sessionId: string) =>
    request<SessionQuestion>(`/mock-sessions/${sessionId}/question`),

  uploadResponse: (sessionId: string, questionId: string, index: number, blob: Blob) => {
    const form = new FormData()
    form.append('question_id', questionId)
    form.append('response_index', String(index))
    form.append('recording', blob, `response-${index}.webm`)
    return request<{ response_id: string; status: string }>(
      `/mock-sessions/${sessionId}/responses`,
      {
        method: 'POST',
        body: form,
        // DEF-006: no Content-Type header — browser sets multipart/form-data with boundary
      },
    )
  },

  complete: (sessionId: string) =>
    request<{ status: string }>(`/mock-sessions/${sessionId}/complete`, {
      method: 'POST',
    }),

  // Returns ScoreReport when scored, or { status: 'processing' } when HTTP 202
  getScore: (sessionId: string) =>
    request<ScoreReport | { status: 'processing' }>(`/mock-sessions/${sessionId}/score`),

  getIceConfig: (sessionId: string) =>
    request<{ iceServers: RTCIceServer[] }>(
      `/mock-sessions/${sessionId}/ice-config`,
    ),
}

// ─── Feedback Archive ─────────────────────────────────────────

export interface FeedbackEntry {
  session_id: string
  type: 'ai_mock' | 'live_human'
  created_at: string
  composite_score: number | null
  expert_name: string | null
  rubric_score: number | null
}

export const feedbackApi = {
  list: (params?: { type?: string; date_from?: string; score_min?: number }) =>
    request<PaginatedResponse<FeedbackEntry>>(
      `/feedback?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {}).filter(([, v]) => v != null),
        ) as Record<string, string>,
      )}`,
    ),

  getRecordingUrl: (sessionId: string) =>
    request<{ url: string; expires_at: string; duration_seconds: number }>(
      `/feedback/${sessionId}/recording`,
    ),

  getScore: (sessionId: string) =>
    request<ScoreReport>(`/mock-sessions/${sessionId}/score`),
}
