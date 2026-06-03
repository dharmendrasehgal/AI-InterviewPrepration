'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionsApi, type Question } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type QuestionType = '' | 'behavioral' | 'technical' | 'situational' | 'role_specific'
type QuestionLevel = '' | 'entry' | 'mid' | 'senior' | 'executive'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(question.bookmarked)

  const bookmarkMutation = useMutation({
    mutationFn: isBookmarked
      ? () => questionsApi.unbookmark(question.id)
      : () => questionsApi.bookmark(question.id),
    onMutate: () => setIsBookmarked((v) => !v),
    onError: () => setIsBookmarked((v) => !v),
  })

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{question.type.replace('_', ' ')}</Badge>
              <Badge variant="secondary" className="capitalize">{question.level}</Badge>
              {question.industry && (
                <Badge variant="outline">{question.industry}</Badge>
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed">{question.text}</p>
          </div>
          <button
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
            className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide sample answer' : 'Show sample answer'}
        </button>
      </div>

      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            Sample answer tips
          </p>
          {question.framework && (
            <p className="text-sm text-muted-foreground">
              Use the <strong>{question.framework}</strong> framework to structure your response.
            </p>
          )}
          {question.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {question.tags.map((tag) => (
                <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function QuestionsPage() {
  const [searchInput, setSearchInput] = useState('')
  const [type, setType] = useState<QuestionType>('')
  const [level, setLevel] = useState<QuestionLevel>('')
  const [industry, setIndustry] = useState('')
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [allItems, setAllItems] = useState<Question[]>([])
  const searchQuery = useDebounce(searchInput, 400)
  const isSearching = searchQuery.trim().length >= 2

  const filterQuery = useQuery({
    queryKey: ['questions', 'list', type, level, industry, cursor],
    queryFn: () =>
      questionsApi.list({
        ...(type ? { type } : {}),
        ...(level ? { level } : {}),
        ...(industry ? { industry } : {}),
        ...(cursor ? { cursor } : {}),
        page_size: 20,
      }),
    enabled: !isSearching,
  })

  const searchQueryResult = useQuery({
    queryKey: ['questions', 'search', searchQuery],
    queryFn: () => questionsApi.search(searchQuery),
    enabled: isSearching,
  })

  // Accumulate pages for "Load more"
  const prevCursorRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!isSearching && filterQuery.data) {
      if (cursor !== prevCursorRef.current) {
        prevCursorRef.current = cursor
        setAllItems((prev) => [...prev, ...filterQuery.data.items])
      } else if (!cursor) {
        prevCursorRef.current = undefined
        setAllItems(filterQuery.data.items)
      }
    }
  }, [filterQuery.data, cursor, isSearching])

  const handleFilterChange = useCallback(() => {
    setCursor(undefined)
    prevCursorRef.current = undefined
    setAllItems([])
  }, [])

  const questions = isSearching
    ? (searchQueryResult.data?.results ?? [])
    : allItems

  const isLoading = isSearching ? searchQueryResult.isLoading : filterQuery.isLoading
  const hasMore = !isSearching && (filterQuery.data?.has_more ?? false)
  const nextCursor = filterQuery.data?.next_cursor ?? undefined

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Question Bank</h1>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <Input
          type="search"
          placeholder="Search questions…"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
            if (!e.target.value) handleFilterChange()
          }}
          aria-label="Search questions"
        />

        {!isSearching && (
          <div className="flex flex-wrap gap-3">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as QuestionType); handleFilterChange() }}
              aria-label="Filter by type"
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All types</option>
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical</option>
              <option value="situational">Situational</option>
              <option value="role_specific">Role specific</option>
            </select>

            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value as QuestionLevel); handleFilterChange() }}
              aria-label="Filter by level"
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All levels</option>
              <option value="entry">Entry</option>
              <option value="mid">Mid</option>
              <option value="senior">Senior</option>
              <option value="executive">Executive</option>
            </select>

            <Input
              type="text"
              placeholder="Industry filter…"
              value={industry}
              onChange={(e) => { setIndustry(e.target.value); handleFilterChange() }}
              aria-label="Filter by industry"
              className="h-9 w-48"
            />
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && questions.length === 0 && (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground">No questions found. Try adjusting your filters.</p>
        </div>
      )}

      {!isLoading && questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCursor(nextCursor)}
            disabled={filterQuery.isFetching}
          >
            {filterQuery.isFetching ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
