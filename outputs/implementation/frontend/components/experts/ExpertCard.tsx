import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ExpertSummary, ExpertTrack } from '@/lib/api/client'

const TRACK_LABELS: Record<ExpertTrack, string> = {
  general_career: 'General Career',
  software_engineering: 'Software Engineering',
  medical: 'Medical / Residency',
}

function formatRate(cents: number): string {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(0)} / 50 min`
}

interface ExpertCardProps {
  expert: ExpertSummary
}

export function ExpertCard({ expert }: ExpertCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{expert.headline}</CardTitle>
          <Badge variant="outline" className="shrink-0 text-xs">
            {TRACK_LABELS[expert.track]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{expert.years_exp} yrs experience</span>
          <span className="font-medium text-foreground">{formatRate(expert.rate_cents)}</span>
        </div>
        <div className="mt-auto pt-2">
          <Link href={`/experts/${expert.expert_id}`} className="block">
            <Button variant="outline" size="sm" className="w-full">
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
