'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Video, Clock, Trash2 } from 'lucide-react'

interface ConsentDialogProps {
  sessionType: 'ai_mock' | 'live_human'
  onAccept: () => void
  onDecline: () => void
}

const CONSENT_POINTS = [
  {
    icon: Video,
    text: 'Your camera and microphone will be recorded during this session.',
  },
  {
    icon: Clock,
    text: 'Recordings are stored securely for up to 90 days.',
  },
  {
    icon: Trash2,
    text: 'You can delete your recording at any time from your Feedback Archive.',
  },
  {
    icon: ShieldCheck,
    text: 'Your data is encrypted and never shared with third parties.',
  },
]

export function ConsentDialog({ sessionType, onAccept, onDecline }: ConsentDialogProps) {
  const [checked, setChecked] = useState(false)

  const title =
    sessionType === 'ai_mock'
      ? 'AI Mock Interview — Recording Consent'
      : 'Live Mock Interview — Recording Consent'

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onDecline() }}>
      <DialogContent
        className="max-w-md"
        aria-describedby="consent-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div id="consent-description" className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Before we begin, please review and accept the following:
          </p>

          <ul className="space-y-3" role="list">
            {CONSENT_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox
              id="consent-checkbox"
              checked={checked}
              onCheckedChange={(val) => setChecked(Boolean(val))}
              aria-required="true"
            />
            <Label
              htmlFor="consent-checkbox"
              className="cursor-pointer text-sm leading-snug"
            >
              I have read and agree to the recording terms above. I understand
              I can delete my recording at any time.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onDecline}>
            Decline — Cancel Session
          </Button>
          <Button
            onClick={onAccept}
            disabled={!checked}
            aria-disabled={!checked}
          >
            Accept &amp; Start Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
