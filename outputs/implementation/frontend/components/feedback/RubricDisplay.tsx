import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { RubricEvaluation } from '@/lib/api/client'

const DIMENSIONS = [
  { key: 'communication' as const, label: 'Communication Clarity' },
  { key: 'technical_depth' as const, label: 'Technical Depth' },
  { key: 'structured_thinking' as const, label: 'Structured Thinking' },
  { key: 'confidence' as const, label: 'Confidence' },
]

function scoreColour(score: number): string {
  if (score >= 4) return 'text-green-600'
  if (score >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

interface RubricDisplayProps {
  rubric: RubricEvaluation
}

export function RubricDisplay({ rubric }: RubricDisplayProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center py-8">
          <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Expert Evaluation Score
          </p>
          <p className={`text-7xl font-bold ${scoreColour(rubric.overall_score)}`}>
            {rubric.overall_score.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">out of 5.0</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimension Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span>{rubric[key]} / 5</span>
              </div>
              <Progress value={(rubric[key] / 5) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expert Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{rubric.feedback_text}</p>
        </CardContent>
      </Card>

      {rubric.notes && (
        <Alert>
          <AlertDescription>
            <strong>Your private notes:</strong> {rubric.notes}
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Submitted {new Date(rubric.submitted_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
      </p>
    </div>
  )
}
