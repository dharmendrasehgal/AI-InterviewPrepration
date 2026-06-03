'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWebRTC } from '@/hooks/use-webrtc'

interface LiveSessionRoomProps {
  sessionId: string
  role: 'candidate' | 'expert'
  peerName: string
  onEnd: () => void
}

function VideoTile({ stream, label, muted = false }: { stream: MediaStream | null; label: string; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg bg-muted">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className="h-full w-full object-cover"
        aria-label={`${label} video feed`}
      />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
        {label}
      </span>
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Connecting…</p>
        </div>
      )}
    </div>
  )
}

export function LiveSessionRoom({ sessionId, role, peerName, onEnd }: LiveSessionRoomProps) {
  const { localStream, remoteStream, status, isMuted, isCameraOff, error, toggleMute, toggleCamera } = useWebRTC({
    sessionId,
    role,
    onDisconnected: onEnd,
  })

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4 p-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Video area */}
      <div className="flex flex-1 gap-4">
        <VideoTile stream={remoteStream} label={peerName} />
        <VideoTile stream={localStream} label="You" muted />
      </div>

      {/* Status indicator */}
      {status === 'connecting' && (
        <p className="text-center text-sm text-muted-foreground">Establishing connection…</p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 pb-2">
        <Button
          variant={isMuted ? 'destructive' : 'outline'}
          size="lg"
          onClick={toggleMute}
          aria-pressed={isMuted}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? '🔇 Unmute' : '🎤 Mute'}
        </Button>

        <Button
          variant={isCameraOff ? 'destructive' : 'outline'}
          size="lg"
          onClick={toggleCamera}
          aria-pressed={isCameraOff}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? '📷 Camera off' : '📷 Camera on'}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={onEnd}
          aria-label="End session"
        >
          ■ End Session
        </Button>
      </div>
    </div>
  )
}
