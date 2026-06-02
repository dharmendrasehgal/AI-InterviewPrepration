import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/db/connection'
import { sessionResponses, mockSessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { metrics } from '@/lib/metrics'

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })

// Cached system prompt — eligible for Anthropic prompt caching
// to reduce latency and cost on repeated scoring calls
const SCORING_SYSTEM_PROMPT = `You are an expert interview coach scoring candidate responses.
Analyze the transcript and return a JSON scoring object.
Be precise, objective, and provide actionable improvement tips.`

const FILLER_WORDS = new Set([
  'um', 'uh', 'like', 'you know', 'so', 'actually', 'basically',
  'literally', 'honestly', 'right', 'okay so', 'kind of', 'sort of',
])

export interface ResponseScore {
  speechRateWpm: number
  fillerWordCount: number
  fillerPercentage: number
  keywordRelevance: number
  clarityScore: number
  improvementTip: string
}

export const scoringService = {
  async scoreSession(sessionId: string): Promise<void> {
    const start = Date.now()

    const responses = await db
      .select()
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId))
      .orderBy(sessionResponses.responseIndex)

    const scores: ResponseScore[] = []

    for (const response of responses) {
      if (!response.transcript) continue

      const score = await scoreResponse(
        response.transcript,
        response.durationSeconds ?? 0,
        response.questionId,
      )

      await db
        .update(sessionResponses)
        .set({
          speechRateWpm: score.speechRateWpm,
          fillerWordCount: score.fillerWordCount,
          fillerPercentage: score.fillerPercentage,
          keywordRelevance: score.keywordRelevance,
          clarityScore: score.clarityScore,
          improvementTip: score.improvementTip,
          scoredAt: new Date(),
        })
        .where(eq(sessionResponses.id, response.id))

      scores.push(score)
    }

    const compositeScore = computeComposite(scores)
    const avgWpm = Math.round(scores.reduce((s, r) => s + r.speechRateWpm, 0) / scores.length)
    const totalFillers = scores.reduce((s, r) => s + r.fillerWordCount, 0)

    await db
      .update(mockSessions)
      .set({
        compositeScore,
        avgWpm,
        totalFillers,
        status: 'scored',
      })
      .where(eq(mockSessions.id, sessionId))

    metrics.scoreReportLatency(Date.now() - start)
    logger.info({ sessionId, compositeScore, durationMs: Date.now() - start }, 'Session scored')
  },
}

async function scoreResponse(
  transcript: string,
  durationSeconds: number,
  questionId: string,
): Promise<ResponseScore> {
  // Local metrics (no API call needed)
  const words = transcript.trim().split(/\s+/)
  const wordCount = words.length
  const speechRateWpm = durationSeconds > 0
    ? Math.round((wordCount / durationSeconds) * 60)
    : 0

  const { fillerWordCount, fillerPercentage } = detectFillerWords(words)

  // AI keyword relevance scoring via Claude with prompt caching
  const { keywordRelevance, improvementTip } = await scoreWithClaude(
    transcript,
    questionId,
    speechRateWpm,
    fillerWordCount,
  )

  const clarityScore = computeClarityScore(speechRateWpm, fillerPercentage, keywordRelevance)

  return { speechRateWpm, fillerWordCount, fillerPercentage, keywordRelevance, clarityScore, improvementTip }
}

function detectFillerWords(words: string[]): { fillerWordCount: number; fillerPercentage: number } {
  const text = words.join(' ').toLowerCase()
  let fillerWordCount = 0

  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi')
    const matches = text.match(regex)
    if (matches) fillerWordCount += matches.length
  }

  const fillerPercentage = words.length > 0
    ? parseFloat(((fillerWordCount / words.length) * 100).toFixed(2))
    : 0

  return { fillerWordCount, fillerPercentage }
}

async function scoreWithClaude(
  transcript: string,
  questionId: string,
  speechRateWpm: number,
  fillerWordCount: number,
): Promise<{ keywordRelevance: number; improvementTip: string }> {
  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: SCORING_SYSTEM_PROMPT,
          // Enable prompt caching on the static system prompt
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Score this interview response transcript.

Question ID: ${questionId}
Speech rate: ${speechRateWpm} WPM (ideal: 130-160 WPM)
Filler words: ${fillerWordCount}

Transcript:
"""
${transcript}
"""

Return JSON only:
{
  "keyword_relevance": <0-100 integer>,
  "improvement_tip": "<one actionable sentence, max 120 chars>"
}`,
        },
      ],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')

    return {
      keywordRelevance: Number(parsed.keyword_relevance ?? 50),
      improvementTip: String(parsed.improvement_tip ?? generateLocalTip(speechRateWpm, fillerWordCount)),
    }
  } catch (err) {
    logger.warn({ err, questionId }, 'Claude scoring failed — using local fallback')
    return {
      keywordRelevance: 50,
      improvementTip: generateLocalTip(speechRateWpm, fillerWordCount),
    }
  }
}

function generateLocalTip(wpm: number, fillers: number): string {
  if (wpm > 180) return 'Slow down slightly — aim for 130–160 WPM for clarity.'
  if (wpm < 100) return 'Speak a bit faster to maintain engagement — aim for 130–160 WPM.'
  if (fillers > 5) return `Reduce filler words (${fillers} detected) — pause silently instead of saying "um".`
  return 'Good pacing. Focus on including more specific examples in your answers.'
}

function computeClarityScore(wpm: number, fillerPct: number, keywordRelevance: number): number {
  // Pacing score: penalise deviation from 130–160 WPM ideal range
  const wpmDelta = Math.abs(wpm - 145)
  const pacingScore = Math.max(0, 100 - wpmDelta * 1.5)

  // Filler score: 0% fillers = 100, 5%+ fillers = 0
  const fillerScore = Math.max(0, 100 - fillerPct * 20)

  // Weighted composite: keyword 50%, pacing 25%, filler 25%
  return Math.round(keywordRelevance * 0.5 + pacingScore * 0.25 + fillerScore * 0.25)
}

function computeComposite(scores: ResponseScore[]): number {
  if (scores.length === 0) return 0
  const avg = scores.reduce((s, r) => s + r.clarityScore, 0) / scores.length
  return Math.round(avg)
}
