'use client'

import { useCallback, useRef, useState } from 'react'

export type RecordingState =
  | 'idle'
  | 'requesting_permissions'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error'

interface UseSessionRecordingReturn {
  state: RecordingState
  durationMs: number
  error: string | null
  recordingBlob: Blob | null
  mimeType: string
  requestPermissions: () => Promise<boolean>
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => Promise<Blob | null>
  reset: () => void
}

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=h264,aac',
    'video/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}

export function useSessionRecording(): UseSessionRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle')
  const [durationMs, setDurationMs] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const mimeTypeRef = useRef<string>(getSupportedMimeType())

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setState('requesting_permissions')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      setState('ready')
      return true
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera and microphone access was denied. Please allow access in your browser settings.'
          : 'Could not access your camera or microphone. Please check your device.'
      setError(msg)
      setState('error')
      return false
    }
  }, [])

  const start = useCallback(() => {
    if (!streamRef.current || state !== 'ready') return
    chunksRef.current = []

    const mimeType = mimeTypeRef.current
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 1_000_000,
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.start(1000) // collect chunks every second
    mediaRecorderRef.current = recorder
    startTimeRef.current = Date.now()
    setState('recording')

    timerRef.current = setInterval(() => {
      setDurationMs(Date.now() - startTimeRef.current)
    }, 500)
  }, [state])

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      clearTimer()
      setState('paused')
    }
  }, [])

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      timerRef.current = setInterval(() => {
        setDurationMs(Date.now() - startTimeRef.current)
      }, 500)
      setState('recording')
    }
  }, [])

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      recorder.onstop = () => {
        clearTimer()
        const mimeType = mimeTypeRef.current || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setRecordingBlob(blob)
        setState('stopped')

        // Release camera/mic tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null

        resolve(blob)
      }

      recorder.stop()
    })
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    setRecordingBlob(null)
    setDurationMs(0)
    setError(null)
    setState('idle')
  }, [])

  return {
    state,
    durationMs,
    error,
    recordingBlob,
    mimeType: mimeTypeRef.current,
    requestPermissions,
    start,
    pause,
    resume,
    stop,
    reset,
  }
}
