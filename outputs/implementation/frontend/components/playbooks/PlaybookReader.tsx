'use client'

import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import type { PlaybookDetail } from '@/lib/api/client'

interface PlaybookReaderProps {
  playbook: PlaybookDetail
}

export function PlaybookReader({ playbook }: PlaybookReaderProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const section = playbook.sections[activeIndex]

  return (
    <div className="flex gap-8">
      {/* Side nav */}
      <nav className="w-52 shrink-0" aria-label="Playbook sections">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Contents
        </p>
        <ul className="space-y-1">
          {playbook.sections.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => setActiveIndex(i)}
                className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
                aria-current={i === activeIndex ? 'page' : undefined}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <Separator orientation="vertical" className="h-auto" />

      {/* Content area */}
      <article className="flex-1 min-w-0">
        <h2 className="mb-4 text-2xl font-bold">{section?.title}</h2>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-wrap leading-relaxed text-foreground">{section?.body}</p>
        </div>

        {section?.questions && section.questions.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-3 text-base font-semibold">Practice Questions</h3>
            <ul className="space-y-2">
              {section.questions.map((q, i) => (
                <li key={i} className="flex gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <span className="shrink-0 font-mono text-muted-foreground">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation between sections */}
        <div className="mt-10 flex justify-between">
          <button
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="text-sm text-primary underline underline-offset-4 disabled:pointer-events-none disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            onClick={() => setActiveIndex((i) => Math.min(playbook.sections.length - 1, i + 1))}
            disabled={activeIndex === playbook.sections.length - 1}
            className="text-sm text-primary underline underline-offset-4 disabled:pointer-events-none disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </article>
    </div>
  )
}
