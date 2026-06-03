'use client'

import { useEffect, useRef, useCallback } from 'react'
import { liveSessionsApi } from '@/lib/api/client'
import { useLiveSessionStore } from '@/lib/store/live-session'

// Signaling message types exchanged over the WebSocket channel
type SignalMessage =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; candidate: RTCIceCandidateInit }
  | { type: 'peer-joined' }
  | { type: 'peer-left' }

interface UseWebRTCOptions {
  sessionId: string
  role: 'candidate' | 'expert'
  onConnected?: () => void
  onDisconnected?: () => void
}

export function useWebRTC({ sessionId, role, onConnected, onDisconnected }: UseWebRTCOptions) {
  const store = useLiveSessionStore()
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])

  const sendSignal = useCallback((msg: SignalMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const createOffer = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendSignal({ type: 'offer', sdp: offer })
  }, [sendSignal])

  useEffect(() => {
    let cancelled = false
    store.setSessionId(sessionId)
    store.setStatus('connecting')

    async function init() {
      try {
        // 1. Get ICE config from server
        const iceConfig = await liveSessionsApi.getIceConfig()

        // 2. Acquire local media
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (cancelled) { localStream.getTracks().forEach((t) => t.stop()); return }
        store.setLocalStream(localStream)

        // 3. Create peer connection
        const pc = new RTCPeerConnection({ iceServers: iceConfig.iceServers })
        pcRef.current = pc

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

        pc.ontrack = (event) => {
          store.setRemoteStream(event.streams[0])
        }

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ type: 'ice-candidate', candidate: event.candidate.toJSON() })
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            store.setStatus('connected')
            onConnected?.()
          }
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            store.setStatus('ended')
            onDisconnected?.()
          }
        }

        // 4. Open WebSocket signaling channel
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001'}/api/v1/signaling/${sessionId}`
        const token = (await import('@/lib/store/auth')).useAuthStore.getState().accessToken
        const ws = new WebSocket(`${wsUrl}?token=${token}`)
        wsRef.current = ws

        ws.onopen = () => {
          // Expert (caller) sends offer when peer joins
          if (role === 'expert') {
            sendSignal({ type: 'peer-joined' })
          }
        }

        ws.onmessage = async (event: MessageEvent) => {
          const msg: SignalMessage = JSON.parse(event.data as string)
          const _pc = pcRef.current
          if (!_pc) return

          if (msg.type === 'peer-joined' && role === 'expert') {
            await createOffer()
          }

          if (msg.type === 'offer') {
            await _pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            // Flush any queued candidates
            for (const c of pendingCandidatesRef.current) {
              await _pc.addIceCandidate(new RTCIceCandidate(c))
            }
            pendingCandidatesRef.current = []
            const answer = await _pc.createAnswer()
            await _pc.setLocalDescription(answer)
            sendSignal({ type: 'answer', sdp: answer })
          }

          if (msg.type === 'answer') {
            await _pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
          }

          if (msg.type === 'ice-candidate') {
            if (_pc.remoteDescription) {
              await _pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
            } else {
              pendingCandidatesRef.current.push(msg.candidate)
            }
          }

          if (msg.type === 'peer-left') {
            store.setStatus('ended')
            onDisconnected?.()
          }
        }

        ws.onerror = () => {
          store.setError('Signaling connection failed. Check your network and try again.')
          store.setStatus('error' as 'idle')
        }

        // Candidate signals they joined
        if (role === 'candidate') {
          ws.onopen = () => sendSignal({ type: 'peer-joined' })
        }
      } catch (err) {
        if (!cancelled) {
          store.setError(err instanceof Error ? err.message : 'Failed to start video call')
          store.setStatus('error' as 'idle')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      wsRef.current?.close()
      pcRef.current?.close()
      store.reset()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role])

  return {
    localStream: store.localStream,
    remoteStream: store.remoteStream,
    status: store.status,
    isMuted: store.isMuted,
    isCameraOff: store.isCameraOff,
    error: store.error,
    toggleMute: store.toggleMute,
    toggleCamera: store.toggleCamera,
  }
}
